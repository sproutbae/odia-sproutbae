// server/utils/pdfGenerator.js
// Generates GST-compliant PDF invoices using html-pdf-node
// No Chromium/Puppeteer needed — uses headless Chrome on Railway automatically

import htmlPdfNode from 'html-pdf-node';

const rupees = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// Convert number to words (Indian system)
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  let result = convert(intPart) + ' Rupees';
  if (decPart > 0) result += ' and ' + convert(decPart) + ' Paise';
  return result + ' Only';
}

export function buildInvoiceHTML(invoice, settings) {
  const inv = invoice;
  const biz = settings || {};
  const isIGST = inv.gstType === 'IGST';

  const itemRows = inv.items.map((item, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>
        <strong>${item.description}</strong>
        ${item.product?.sku ? `<br><span style="font-size:10px;color:#888">${item.product.sku}</span>` : ''}
      </td>
      <td style="text-align:center">${item.hsnCode || '—'}</td>
      <td style="text-align:center">${item.qty} ${item.unit}</td>
      <td style="text-align:right">${rupees(item.rate)}</td>
      <td style="text-align:right">${rupees(item.taxableAmt)}</td>
      ${isIGST
        ? `<td style="text-align:center">${item.gstRate}%</td><td style="text-align:right">${rupees(item.igst)}</td>`
        : `<td style="text-align:center">${item.gstRate / 2}%</td><td style="text-align:right">${rupees(item.cgst)}</td>
           <td style="text-align:center">${item.gstRate / 2}%</td><td style="text-align:right">${rupees(item.sgst)}</td>`
      }
      <td style="text-align:right"><strong>${rupees(item.totalAmt)}</strong></td>
    </tr>
  `).join('');

  const gstHeaders = isIGST
    ? `<th>IGST %</th><th>IGST Amt</th>`
    : `<th>CGST %</th><th>CGST Amt</th><th>SGST %</th><th>SGST Amt</th>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 12px; color: #1a1a1a; background: white; }
  .page { padding: 24px 28px; max-width: 794px; margin: 0 auto; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #E8180A; padding-bottom: 14px; margin-bottom: 14px; }
  .biz-name { font-size: 28px; font-weight: 900; color: #E8180A; letter-spacing: -0.5px; font-family: Georgia, serif; }
  .biz-sub { font-size: 10px; color: #888; margin-top: 2px; }
  .biz-info { font-size: 10px; color: #555; margin-top: 4px; line-height: 1.5; }
  .inv-title { text-align: right; }
  .inv-title h2 { font-size: 18px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; }
  .inv-no { font-size: 20px; font-weight: 900; color: #E8180A; font-family: 'Courier New', monospace; margin-top: 4px; }
  .inv-dates { font-size: 10px; color: #555; margin-top: 6px; line-height: 1.7; }

  /* Party boxes */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .party-box { border: 1px solid #f0e0de; border-radius: 8px; padding: 10px 12px; background: #fffaf9; }
  .party-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #E8180A; margin-bottom: 5px; }
  .party-name { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .party-detail { font-size: 10px; color: #666; margin-top: 2px; line-height: 1.5; }

  /* Items table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #E8180A; color: white; padding: 7px 6px; font-size: 10px; text-align: left; font-weight: 600; }
  td { padding: 6px 6px; font-size: 11px; border-bottom: 1px solid #fce8e3; vertical-align: top; }
  tr:nth-child(even) td { background: #fffaf9; }
  tr:last-child td { border-bottom: none; }

  /* Totals */
  .totals-section { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
  .amount-words { flex: 1; background: #fffaf9; border: 1px solid #f0e0de; border-radius: 8px; padding: 10px 12px; }
  .amount-words-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #E8180A; margin-bottom: 4px; letter-spacing: 1px; }
  .amount-words-text { font-size: 10px; color: #333; font-style: italic; line-height: 1.5; }
  .totals-box { min-width: 220px; }
  .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #555; border-bottom: 1px solid #fce8e3; }
  .total-row:last-child { border-bottom: none; }
  .total-final { font-size: 14px; font-weight: 700; color: #E8180A; padding: 8px 0 4px; border-top: 2px solid #E8180A; margin-top: 4px; }

  /* Bank & signature */
  .footer-section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  .bank-box { border: 1px solid #f0e0de; border-radius: 8px; padding: 10px 12px; background: #fffaf9; }
  .bank-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #E8180A; margin-bottom: 5px; letter-spacing: 1px; }
  .bank-detail { font-size: 10px; color: #555; line-height: 1.8; }
  .sig-box { border: 1px solid #f0e0de; border-radius: 8px; padding: 10px 12px; text-align: right; background: #fffaf9; }
  .sig-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #E8180A; letter-spacing: 1px; }
  .sig-name { font-size: 12px; font-weight: 700; margin-top: 40px; color: #1a1a1a; }
  .sig-title { font-size: 10px; color: #888; }

  /* Terms */
  .terms { margin-top: 12px; padding: 8px 12px; background: #fffaf9; border-left: 3px solid #E8180A; border-radius: 0 6px 6px 0; }
  .terms-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #E8180A; margin-bottom: 3px; letter-spacing: 1px; }
  .terms-text { font-size: 10px; color: #666; line-height: 1.5; }

  /* Footer strip */
  .footer-strip { margin-top: 14px; text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #f0e0de; padding-top: 8px; }

  /* Status watermark */
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 72px; font-weight: 900; opacity: 0.04; color: #E8180A; pointer-events: none;
    text-transform: uppercase; letter-spacing: 8px; z-index: 0; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  ${inv.status === 'CANCELLED' ? '<div class="watermark">CANCELLED</div>' : ''}
  ${inv.status === 'DRAFT' ? '<div class="watermark">DRAFT</div>' : ''}

  <!-- Header -->
  <div class="header">
    <div>
      <div class="biz-name">${biz.name || 'SproutBae'}</div>
      <div class="biz-sub">Wholesale Billing</div>
      <div class="biz-info">
        ${biz.address ? biz.address + ', ' : ''}${biz.city || ''} ${biz.pincode || ''}<br>
        ${biz.state ? 'State: ' + biz.state + ' | ' : ''}GSTIN: ${biz.gstin || 'N/A'}<br>
        ${biz.phone ? 'Ph: ' + biz.phone : ''} ${biz.email ? '| ' + biz.email : ''}
      </div>
    </div>
    <div class="inv-title">
      <h2>${inv.type?.replace(/_/g, ' ') || 'Tax Invoice'}</h2>
      <div class="inv-no">${inv.invoiceNo}</div>
      <div class="inv-dates">
        Invoice Date: <strong>${fmtDate(inv.invoiceDate)}</strong><br>
        ${inv.dueDate ? 'Due Date: <strong>' + fmtDate(inv.dueDate) + '</strong>' : ''}
      </div>
    </div>
  </div>

  <!-- Parties -->
  <div class="parties">
    <div class="party-box">
      <div class="party-label">Bill To</div>
      <div class="party-name">${inv.customer?.name || ''}</div>
      <div class="party-detail">
        ${inv.customer?.address ? inv.customer.address + '<br>' : ''}
        ${inv.customer?.city || ''} ${inv.customer?.state || ''} ${inv.customer?.pincode ? '- ' + inv.customer.pincode : ''}<br>
        ${inv.customer?.gstin ? 'GSTIN: ' + inv.customer.gstin + '<br>' : ''}
        ${inv.customer?.phone ? 'Ph: ' + inv.customer.phone : ''}
      </div>
    </div>
    <div class="party-box">
      <div class="party-label">Payment Info</div>
      <div class="party-detail">
        <strong>Invoice #:</strong> ${inv.invoiceNo}<br>
        <strong>GST Type:</strong> ${isIGST ? 'IGST (Inter-state)' : 'CGST + SGST (Intra-state)'}<br>
        ${inv.placeOfSupply ? '<strong>Place of Supply:</strong> ' + inv.placeOfSupply + '<br>' : ''}
        <strong>Amount Due:</strong> <span style="color:#E8180A;font-weight:700">${rupees(inv.balanceDue)}</span>
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Description</th>
        <th style="width:55px">HSN</th>
        <th style="width:60px">Qty</th>
        <th style="width:75px">Rate</th>
        <th style="width:80px">Taxable Amt</th>
        ${gstHeaders}
        <th style="width:85px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="amount-words">
      <div class="amount-words-label">Amount in Words</div>
      <div class="amount-words-text">${numberToWords(Math.round(inv.grandTotal))}</div>
    </div>
    <div class="totals-box">
      <div class="total-row"><span>Subtotal (Taxable Value)</span><span>${rupees(inv.subtotal)}</span></div>
      ${inv.discount > 0 ? `<div class="total-row"><span>Discount</span><span>- ${rupees(inv.discount)}</span></div>` : ''}
      ${isIGST
        ? `<div class="total-row"><span>IGST</span><span>${rupees(inv.igst)}</span></div>`
        : `<div class="total-row"><span>CGST</span><span>${rupees(inv.cgst)}</span></div>
           <div class="total-row"><span>SGST</span><span>${rupees(inv.sgst)}</span></div>`
      }
      <div class="total-row total-final">
        <span>GRAND TOTAL</span><span>${rupees(inv.grandTotal)}</span>
      </div>
      ${inv.amountPaid > 0 ? `
        <div class="total-row" style="color:#16a34a"><span>Amount Paid</span><span>${rupees(inv.amountPaid)}</span></div>
        <div class="total-row" style="color:#d97706;font-weight:700"><span>Balance Due</span><span>${rupees(inv.balanceDue)}</span></div>
      ` : ''}
    </div>
  </div>

  <!-- Bank & Signature -->
  <div class="footer-section">
    <div class="bank-box">
      <div class="bank-label">Bank Details</div>
      <div class="bank-detail">
        ${biz.bankName ? '<strong>Bank:</strong> ' + biz.bankName + '<br>' : ''}
        ${biz.accountNo ? '<strong>A/C No:</strong> ' + biz.accountNo + '<br>' : ''}
        ${biz.ifsc ? '<strong>IFSC:</strong> ' + biz.ifsc + '<br>' : ''}
        ${biz.upiId ? '<strong>UPI:</strong> ' + biz.upiId : ''}
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-label">For ${biz.name || 'SproutBae'}</div>
      <div class="sig-name">${biz.name || 'SproutBae'}</div>
      <div class="sig-title">Authorised Signatory</div>
    </div>
  </div>

  <!-- Terms -->
  ${inv.terms ? `
  <div class="terms">
    <div class="terms-label">Terms & Conditions</div>
    <div class="terms-text">${inv.terms}</div>
  </div>` : ''}

  ${inv.notes ? `
  <div class="terms" style="margin-top:6px">
    <div class="terms-label">Notes</div>
    <div class="terms-text">${inv.notes}</div>
  </div>` : ''}

  <!-- Footer strip -->
  <div class="footer-strip">
    This is a computer generated invoice. | Generated by SproutBae Wholesale Billing System
  </div>
</div>
</body>
</html>`;
}

export async function generateInvoicePDF(invoice, settings) {
  const html = buildInvoiceHTML(invoice, settings);
  const file = { content: html };
  const options = {
    format: 'A4',
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    printBackground: true,
  };
  return htmlPdfNode.generatePdf(file, options);
}

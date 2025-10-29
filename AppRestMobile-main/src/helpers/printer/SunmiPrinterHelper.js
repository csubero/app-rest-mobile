import SunmiPrinter, {AlignValue} from '@heasy/react-native-sunmi-printer';
import Utils from '../utils/Utils';
import StorageHelper from '../config/StorageHelper';

class PrintItem {
  constructor(text, alignment, fontSize, marginBottom = 0, qrData = '') {
    this.text = text;
    this.alignment = alignment;
    this.fontSize = fontSize || 16;
    this.marginBottom = marginBottom;
    this.qrData = qrData;
    this.alignmentPrivate = AlignValue.LEFT;

    switch (alignment) {
      case 'left':
        this.alignmentPrivate = AlignValue.LEFT;
        break;
      case 'center':
        this.alignmentPrivate = AlignValue.CENTER;
        break;
      case 'right':
        this.alignmentPrivate = AlignValue.RIGHT;
        break;
    }
  }
}

export class SunmiPrinterHelper {
  constructor() {}

  static PrintTicket(items) {
    SunmiPrinter.enterPrinterBuffer(true);

    for (const item of items) {
      SunmiPrinter.setAlignment(item.alignmentPrivate);
      SunmiPrinter.setFontSize(item.fontSize);
      SunmiPrinter.printerText(`${item.text}\n`);
      SunmiPrinter.lineWrap(item.marginBottom);
    }

    SunmiPrinter.exitPrinterBuffer(true);
  }

  static isPrinterAvailable() {
    try {
      // Verificar si la librería SunmiPrinter está disponible
      if (!SunmiPrinter) {
        console.log('❌ SunmiPrinter no está disponible');
        return false;
      }

      // Verificar si los métodos principales existen
      if (
        typeof SunmiPrinter.printerText !== 'function' ||
        typeof SunmiPrinter.enterPrinterBuffer !== 'function' ||
        typeof SunmiPrinter.exitPrinterBuffer !== 'function'
      ) {
        console.log('❌ Métodos de SunmiPrinter no están disponibles');
        return false;
      }

      // Verificar que la clase PrintItem se pueda instanciar
      const testItem = new PrintItem('test', 'center', 16);
      if (!testItem) {
        console.log('❌ No se puede crear PrintItem');
        return false;
      }

      console.log('✅ Impresora Sunmi disponible');
      return true;
    } catch (error) {
      console.log('❌ Error al verificar impresora Sunmi:', error);
      return false;
    }
  }

  static printTestReceipt() {
    // Verificar que la impresora esté disponible
    if (!this.isPrinterAvailable()) {
      console.log('❌ Impresora no disponible para impresión de prueba');
      throw new Error('Impresora no disponible');
    }

    const testItems = [];

    // Encabezado
    testItems.push(new PrintItem('PRUEBA DE IMPRESION', 'center', 32, 1));
    testItems.push(new PrintItem('Kiosko Self-Service', 'center', 24, 0.5));
    testItems.push(
      new PrintItem('===============================', 'center', 24, 0.5),
    );

    // Información de prueba
    testItems.push(new PrintItem('Fecha y Hora:', 'left', 22, 0));
    testItems.push(
      new PrintItem(new Date().toLocaleString('es-ES'), 'left', 22, 0.5),
    );

    testItems.push(new PrintItem('Estado del Sistema:', 'left', 22, 0.5));
    testItems.push(new PrintItem('✓ Impresora: Conectada', 'left', 20, 0));
    testItems.push(new PrintItem('✓ Sistema: Funcionando', 'left', 20, 0));
    testItems.push(new PrintItem('✓ Conexión: Estable', 'left', 20, 0.5));

    // Separador
    testItems.push(
      new PrintItem('===============================', 'center', 24, 0.5),
    );

    // Mensaje final
    testItems.push(new PrintItem('IMPRESION EXITOSA', 'center', 28, 0.5));
    testItems.push(new PrintItem('✓ Hardware funcionando', 'center', 20, 0));
    testItems.push(new PrintItem('✓ Librería conectada', 'center', 20, 1));

    // Imprimir usando el método principal
    this.PrintTicket(testItems);
  }

  static async printInvoice(
    invoice,
    companySelected,
    pointOfSaleSelected,
    serverIp = null,
    apiToken = null,
  ) {
    // Verificar que la impresora esté disponible
    if (!this.isPrinterAvailable()) {
      console.log('❌ Impresora no disponible para impresión de factura');
      throw new Error('Impresora no disponible');
    }

    // Si serverIp o apiToken no existen o son null, obtenerlos del StorageHelper
    let finalServerIp = serverIp;
    let finalApiToken = apiToken;

    if (!finalServerIp || !finalApiToken) {
      try {
        const authInfo = await StorageHelper.getAuthInfo();

        if (!finalServerIp && authInfo && authInfo.serverIp) {
          finalServerIp = authInfo.serverIp;
        }

        if (!finalApiToken && authInfo && authInfo.apiToken) {
          finalApiToken = authInfo.apiToken;
        }
      } catch (error) {
        console.log('❌ Error al obtener authInfo del storage:', error);
      }
    }

    // if (invoice && invoice !== null && invoice.print_invoice) {
    if (invoice && invoice !== null) {
      const printInvoiceData = [];

      printInvoiceData.push(
        new PrintItem(companySelected.name, 'center', 50, 0.75),
      );

      if (
        companySelected.company_info &&
        companySelected.company_info.length > 0
      ) {
        companySelected.company_info.forEach(info => {
          printInvoiceData.push(new PrintItem(info, 'center', 24, 0));
        });
      }

      printInvoiceData.push(
        new PrintItem(
          `Factura: ${invoice.series}/${invoice.number}`,
          'left',
          24,
          0,
        ),
      );

      printInvoiceData.push(
        new PrintItem(`Fecha: ${invoice.date}`, 'left', 22, 0),
        new PrintItem(`Cliente: ${invoice.client_name}`, 'left', 22, 0),
      );

      printInvoiceData.push(
        new PrintItem(`Consecutivo: ${invoice.consecutive}`, 'left', 22, 0),
      );

      printInvoiceData.push(
        new PrintItem(`Clave: ${invoice.key}`, 'left', 22, 0.5),
      );

      printInvoiceData.push(
        new PrintItem(
          '------------------------------------------------',
          'center',
          24,
          0,
        ),
      );

      const headers = ['DESCRIPCION', 'CANT', 'PRECIO', 'TOTAL'];
      const headersStr = Utils.concatWords(headers, 48);

      printInvoiceData.push(new PrintItem(headersStr, 'left', 22, 0));
      printInvoiceData.push(
        new PrintItem(
          '------------------------------------------------',
          'center',
          24,
          0,
        ),
      );

      const products = invoice.items;

      products.forEach((product, index) => {
        let productNameStr = product.name;
        let productNameSecondLine = null;

        if (productNameStr.length > 15) {
          productNameStr = `${product.name.substring(0, 15).trim()}`;
          productNameSecondLine = `${product.name.substring(15).trim()}`;
        }

        const productStr = Utils.concatWords(
          [
            productNameStr,
            `${product.quantity}`,
            `${product.price.toFixed(2)}`,
            `${parseFloat(product.total.toString()).toFixed(2)}`,
          ],
          48,
        );

        printInvoiceData.push(new PrintItem(productStr, 'left', 22, 0));

        if (productNameSecondLine) {
          printInvoiceData.push(
            new PrintItem(`${productNameSecondLine}`, 'left', 22, 0),
          );
        }

        product.modifiers.forEach((modifier, indexModifier) => {
          printInvoiceData.push(
            new PrintItem(
              `   ${modifier.name} x ${modifier.quantity}: ${parseFloat(
                modifier.total.toString(),
              ).toFixed(2)}`,
              'left',
              20,
              0,
            ),
          );

          // 🆕 Imprimir nested_modifiers si existen
          if (modifier.nested_modifiers && modifier.nested_modifiers.length > 0) {
            modifier.nested_modifiers.forEach((nestedMod, nestedIndex) => {
              printInvoiceData.push(
                new PrintItem(
                  `      ${nestedMod.name} x ${nestedMod.quantity}: ${parseFloat(
                    nestedMod.total.toString(),
                  ).toFixed(2)}`,
                  'left',
                  18,
                  0,
                ),
              );
            });
          }
        });

        if (product.discount > 0) {
          const discountStr = Utils.concatWords(
            ['   -DESCUENTO: ', `-${product.discount.toFixed(2)}`],
            48,
          );

          printInvoiceData.push(new PrintItem(discountStr, 'left', 22, 0));
        }
      });

      printInvoiceData.push(
        new PrintItem(
          '------------------------------------------------',
          'center',
          24,
          0,
        ),
      );

      // Usar tax_breakdown si existe, sino usar los valores originales
      const taxBreakdown = invoice.tax_breakdown;
      
      if (taxBreakdown) {
        // Subtotal después de descuentos de productos
        const subtotalStr = Utils.concatWords(
          ['', 'SUBTOTAL: ', '', `CRC ${taxBreakdown.subtotal_after_item_discounts.toFixed(2)}`],
          48,
        );
        printInvoiceData.push(new PrintItem(subtotalStr, 'left', 22, 0));

        // Descuento general de la factura si existe
        if (taxBreakdown.invoice_discount > 0) {
          const invoiceDiscountStr = Utils.concatWords(
            ['', 'DESCUENTO: ', '', `CRC ${taxBreakdown.invoice_discount.toFixed(2)}`],
            48,
          );
          printInvoiceData.push(new PrintItem(invoiceDiscountStr, 'left', 22, 0));
        }

        // Subtotal después de todos los descuentos
        const subtotalAfterDiscountsStr = Utils.concatWords(
          ['', 'SUBTOTAL NETO: ', '', `CRC ${taxBreakdown.subtotal_after_all_discounts.toFixed(2)}`],
          48,
        );
        printInvoiceData.push(new PrintItem(subtotalAfterDiscountsStr, 'left', 22, 0));

        // Impuestos aplicados detallados
        if (taxBreakdown.taxes_applied && taxBreakdown.taxes_applied.length > 0) {
          taxBreakdown.taxes_applied.forEach(tax => {
            const taxStr = Utils.concatWords(
              ['', `${tax.name} (${tax.rate}%): `, '', `CRC ${tax.amount.toFixed(2)}`],
              48,
            );
            printInvoiceData.push(new PrintItem(taxStr, 'left', 22, 0));
          });
        }

        // Total de impuestos
        const totalTaxesStr = Utils.concatWords(
          ['', 'TOTAL IMPUESTOS: ', '', `CRC ${taxBreakdown.total_tax_amount.toFixed(2)}`],
          48,
        );
        printInvoiceData.push(new PrintItem(totalTaxesStr, 'left', 22, 0));

        // Total final
        const totalStr = Utils.concatWords(
          ['', 'TOTAL: ', '', `CRC ${taxBreakdown.invoice_total.toFixed(2)}`],
          48,
        );
        printInvoiceData.push(new PrintItem(totalStr, 'left', 22, 0));
      } else {
        // Fallback a los valores originales si no hay tax_breakdown
        const subtotalStr = Utils.concatWords(
          ['', 'SUBTOTAL: ', '', `CRC ${invoice.sub_total.toFixed(2)}`],
          48,
        );
        printInvoiceData.push(new PrintItem(subtotalStr, 'left', 22, 0));

        const discountStr = Utils.concatWords(
          ['', 'DESCUENTOS: ', '', `CRC ${invoice.discount.toFixed(2)}`],
          48,
        );
        printInvoiceData.push(new PrintItem(discountStr, 'left', 22, 0));

        const taxesStr = Utils.concatWords(
          ['', 'IMPUESTOS: ', '', `CRC ${invoice.total_taxes.toFixed(2)}`],
          48,
        );
        printInvoiceData.push(new PrintItem(taxesStr, 'left', 22, 0));

        const totalStr = Utils.concatWords(
          ['', 'TOTAL: ', '', `CRC ${invoice.total.toFixed(2)}`],
          48,
        );
        printInvoiceData.push(new PrintItem(totalStr, 'left', 22, 0));
      }

      printInvoiceData.push(
        new PrintItem('Autorizada mediante resolucion', 'center', 20, 0),
        new PrintItem(
          '# MH-DGT-RES-0027-2024 del 13 de noviembre de 2024',
          'center',
          20,
          0,
        ),
        new PrintItem('Version 4.4', 'center', 20, 0),
        new PrintItem('Gestione su factura electronica', 'center', 20, 0),
      );

      let orText = '';

      if (pointOfSaleSelected.print_qr) {
        orText = 'o ';
        printInvoiceData.push(
          new PrintItem('escaneando el siguiente codigo:', 'center', 20, 0),
          new PrintItem(
            '',
            'center',
            20,
            0.25,
            `https://facturaelectronica.ar-holdings.com/${invoice.key}/`,
          ),
        );
      }

      printInvoiceData.push(
        new PrintItem(`${orText}visitando el sitio:`, 'center', 20, 0),
        new PrintItem('facturaelectronica.ar-holdings.com', 'center', 20, 0),
      );

      this.PrintTicket(printInvoiceData);
    }
  }
}

export {PrintItem};

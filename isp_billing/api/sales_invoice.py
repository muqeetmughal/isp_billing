import frappe
from frappe.query_builder import DocType




@frappe.whitelist(allow_guest=True)
def get_sales_invoice(email):
    SalesInvoice = DocType("Sales Invoice")
    Customer = DocType("Customer")
    
    sales_invoices = (
        frappe.qb.from_(SalesInvoice)
            .join(Customer)
            .on(SalesInvoice.customer == Customer.name)
            .select(SalesInvoice.name, 
                    SalesInvoice.customer, 
                    SalesInvoice.company, 
                    SalesInvoice.currency, 
                    SalesInvoice.grand_total,
                    SalesInvoice.posting_date,
                    SalesInvoice.status
                )
            .where(Customer.custom_email == email)
            .run(as_dict=True)
    )
    
    return sales_invoices





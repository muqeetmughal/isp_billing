import frappe
from frappe.query_builder import DocType
from frappe.utils import add_days, nowdate



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





def cli_subscription_list():
    CLI_Subscription = DocType("CLI Subscription")

    query = ( frappe.qb.from_(CLI_Subscription) .select( CLI_Subscription.name ) ).run(as_dict=True)

    return query




@frappe.whitelist()

def create_invoices_for_all_subscriptions():
    """Create invoices for all CLI Subscriptions"""

    subscriptions = cli_subscription_list()
    if not subscriptions:
        return {"success": False, "message": "No subscriptions found"}
    
    print("CLI Subscription", subscriptions)

    created_invoices_all = []

    for sub in subscriptions:
        subscription = sub.get("name")
        if not subscription:
            continue

        sub_doc = frappe.get_doc("CLI Subscription", subscription)

        if not sub_doc.customer:
            frappe.log_error(f"Customer missing in CLI Subscription {subscription}")
            continue

        # get customer doc to fetch mandate id (if needed later)
        customer_doc = frappe.get_doc("Customer", sub_doc.customer)
        mandate_id = customer_doc.custom_gocardless_mandate_id

        services = sub_doc.get("service") or []
        created_invoices = []

        for svc in services:
            if svc.status != "Active":
                continue

            # ✅ Only create invoice if no invoice linked already
            if svc.sales_invoice_id:
                continue  

            # Fetch Subscription Plan to get item
            plan = frappe.get_doc("Subscription Plan", svc.plan)
            if not plan.item:
                frappe.log_error(f"No Item linked in Subscription Plan {svc.plan}")
                continue

            # Create Sales Invoice
            si = frappe.new_doc("Sales Invoice")
            si.customer = sub_doc.customer
            si.posting_date = nowdate()
            si.due_date = add_days(nowdate(), 7)   # 7 days ahead

            si.append("items", {
                "item_code": plan.item,
                "qty": svc.quantity,
                "rate": svc.price
            })

            si.insert(ignore_permissions=True)
            si.submit()
            created_invoices.append((si.name, plan.plan_name or plan.name))

            # 🔹 Save Sales Invoice ID in service row
            svc.sales_invoice_id = si.name

        # 🔹 Save subscription so child table updates
        sub_doc.save(ignore_permissions=True)

        if created_invoices:
            created_invoices_all.append({
                "subscription": subscription,
                "invoices": created_invoices
            })

    return {"success": True, "created": created_invoices_all}












@frappe.whitelist()
def cleanup_paid_invoices():

    subscriptions = cli_subscription_list()
    if not subscriptions:
        return {"success": False, "message": "No subscriptions found"}
    
    print("CLI Subscription", subscriptions)

    for sub in subscriptions:
        subscription = sub.get("name")
        if not subscription:
            continue


    """Remove sales_invoice_id from subscription services if invoice is already paid"""
    subscription = frappe.get_doc("CLI Subscription", subscription)
    updated_rows = []

    for svc in subscription.get("service") or []:
        if not svc.sales_invoice_id:
            continue

        inv = frappe.db.get_value(
            "Sales Invoice",
            svc.sales_invoice_id,
            ["status", "custom_gocardless_payment_status"],
            as_dict=True
        )

        if not inv:
            continue

        # ✅ check conditions
        if inv.status == "Paid" or inv.custom_gocardless_payment_status in ["paid", "paid_out", "Paid", "Paid Out", "Paid out"]:
            frappe.db.set_value(
                "Subscription Service",
                svc.name,
                "sales_invoice_id",
                None
            )
            updated_rows.append(svc.sales_invoice_id)

    return {
        "success": True,
        "cleared_invoices": updated_rows
    }



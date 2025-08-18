import frappe
from frappe.query_builder import DocType






@frappe.whitelist()
def get_customer_name_by_email(email):
    result = get_customer_by_email(email)
    if result and len(result) > 0:
        return result[0].get("name")   # return Customer.name
    else:
        return("Customer not found for this email")




@frappe.whitelist(allow_guest=True)
def get_customer_by_email(email):
    Customer = DocType("Customer")
    query = (
        frappe.qb.from_(Customer)
            .select(
                Customer.name,
                Customer.customer_name,
                Customer.custom_email,
            )
            .where(Customer.custom_email == email)
    ).run(as_dict=True)
    return query




@frappe.whitelist(allow_guest=True)
def get_sales_invoice():
    SalesInvoice = DocType("Sales Invoice")
    Customer = DocType("Customer")
    
    query = (
        frappe.qb.from_(SalesInvoice)
            .join(Customer)
            .on(SalesInvoice.customer == Customer.name)
            .select(
                SalesInvoice.name, 
                SalesInvoice.customer, 
                SalesInvoice.company, 
                SalesInvoice.currency, 
                SalesInvoice.grand_total,
                SalesInvoice.posting_date,
                SalesInvoice.status
            )
    )
    sales_invoices = query.run(as_dict=True)
    return sales_invoices






@frappe.whitelist(allow_guest=True)
def get_customer():
    Customer = DocType("Customer")
    
    customers = (
        frappe.qb.from_(Customer)
            .select(
                Customer.name,
                Customer.customer_name, 
                Customer.custom_email,
                Customer.custom_mobile_no,
                Customer.custom_billing_email,
                Customer.custom_partner,
                Customer.custom_billing_type,
                Customer.custom_city,
                Customer.custom_portal_login,
                Customer.custom_portal_password,
                Customer.custom_location,
                Customer.custom_date_added,
                Customer.custom_street,
                Customer.custom_zip_code,
                Customer.custom_reseller,
                Customer.custom_company,
                Customer.custom_agent,
                Customer.custom_identification,
                Customer.custom_date_of_birth,
                Customer.custom_hotspot_mac
                )
            .run(as_dict=True)
    )
    return customers










def send_welcome_email(doc, method):
   
    welcome_email_template = frappe.get_doc("Email Template", "Welcome Email")

    subject = welcome_email_template.subject
    message = frappe.render_template(welcome_email_template.response, {"doc": doc})

    frappe.sendmail(
        recipients=[doc.custom_email],
        subject=subject,
        message=message,
        delayed=False
    )
    
    return(f"Welcome email sent to {doc.custom_email} for Customer {doc.name}.")








@frappe.whitelist(allow_guest=True)
def create_lead(name, pipline_status, partner, location, city, email, billing_email, mobile_no, street, zip_code, date_added, billing_type, score):

    doc = frappe.get_doc({
        "doctype": "Lead",
        "first_name": name,
        "custom_pipeline_status": pipline_status,
        "custom_partner": partner,
        "custom_location": location,
        "custom_city": city,
        "email_id": email,
        "custom_billing_email": billing_email,
        "mobile_no": mobile_no,
        "custom_street": street,
        "custom_zip_code": zip_code,
        "custom_date_added": date_added,
        "custom_billing_type": billing_type,
        "custom_score": score,
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    frappe.local.response.http_status_code = 201
    return {
        "msg": "Lead Created Successfully",
        "lead": doc.name,
        "success": True
    }








@frappe.whitelist(allow_guest=True)
def get_subscription_enhancement(enhancement_id):
    SubscriptionEnhancement = DocType("Subscription Enhancement")
    SubscriptionPlanDetail = DocType("Subscription Plan Detail")
    
    enhancements = (
        frappe.qb.from_(SubscriptionEnhancement)
            .join(SubscriptionPlanDetail).on(SubscriptionEnhancement.name == SubscriptionPlanDetail.parent)

            .select(
                SubscriptionEnhancement.name,
                SubscriptionEnhancement.customer,
                SubscriptionEnhancement.start_date,
                SubscriptionEnhancement.end_date,
                SubscriptionEnhancement.status,
                SubscriptionEnhancement.amount,
                SubscriptionEnhancement.payment_link,
                SubscriptionPlanDetail.plan,
                SubscriptionPlanDetail.qty
            )
            .where(SubscriptionEnhancement.name == enhancement_id)
            .run(as_dict=True)
    )
    
    # return enhancements
    subscription_enhancement = {}
    for row in enhancements:
        enhancement_name = row["name"]
        if enhancement_name not in subscription_enhancement:
            subscription_enhancement[enhancement_name] = {
                "name": enhancement_name,
                "customer": row["customer"],
                "status": row["status"],
                "start_date": row["start_date"],
                "end_date": row["end_date"],
                "amount": row["amount"],
                "payment_link": row["payment_link"],
                "plans": []
            }

        subscription_enhancement[enhancement_name]["plans"].append({
            "plan": row["plan"],
            "qty": row["qty"]
        })

    return list(subscription_enhancement.values())


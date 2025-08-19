import frappe
from frappe.query_builder import DocType




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















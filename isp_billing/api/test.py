import frappe
from frappe.query_builder import DocType




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





# Create Payment Request for a Sales Invoice
def create_payment_request():
    pr = frappe.get_doc({
        "doctype": "Payment Request",
        "payment_gateway": "GoCardless-YourGatewayName",
        "reference_doctype": "Sales Invoice",
        "reference_name": "ACC-SINV-2025-00020",
        "party_type": "Customer",
        "party": "Suleman Saeed",
        "currency": "USD",
        "grand_total": 100,
        "email_to": "salmansaeed7272@gmail.com"
    })
    pr.insert()
    pr.submit()
    return {
        "msg": "Payment Request created successfully",
        "payment_request": pr.name,
        "success": True
    }


def create_gocardless_mandate():
       
    doc = frappe.get_doc({
        "doctype": "GoCardless Mandate",
        "customer": "Suleman Saeed",
        "mandate": "Suleman Saeed",
        "gocardless_customer": "Suleman Saeed",
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    frappe.local.response.http_status_code = 201
    return {
        "msg": "GoCardless Mandate Created Successfully",
        "mandate": doc.name,
        "success": True
    }
























# import frappe
# from frappe.utils.password import update_password
# from frappe.utils import random_string

# def send_password_reset_email(user_email):
#     """Send reset password link using Email Template"""

#     # Generate reset link
#     user = frappe.get_doc("User", user_email)
#     key = random_string(32)
#     user.reset_password_key = key
#     user.db_update()

#     reset_link = f"{frappe.utils.get_url()}/update-password?key={key}"

#     # Fetch Email Template
#     email_template = frappe.get_doc("Email Template", "Reset User Password")
#     subject = frappe.render_template(email_template.subject, {"user": user, "reset_link": reset_link})
#     message = frappe.render_template(email_template.response, {"user": user, "reset_link": reset_link})

#     # Send Email
#     frappe.sendmail(
#         recipients=[user_email],
#         subject=subject,
#         message=message,
#         reference_doctype="User",
#         reference_name=user.name
#     )

# def send_password_setup_mail(doc, method):
#     """Auto-send password setup email when new User created"""
#     if doc.email:
#         send_password_reset_email(doc.email)





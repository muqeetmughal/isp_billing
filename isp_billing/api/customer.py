import frappe
from frappe.utils import random_string
from frappe.query_builder import DocType






@frappe.whitelist(allow_guest=True)
def get_customer(email):
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
                Customer.custom_hotspot_mac,
                Customer.custom_portaone_customers_ids,
                Customer.custom_pax8_company_id,
                Customer.custom_company_id,
                Customer.custom_gdpr_agreement,
                Customer.custom_pax8_csv_company_id,
                Customer.custom_vat_id
                )
                .where(Customer.custom_email == email)
            .run(as_dict=True)
    )
    return customers


@frappe.whitelist(allow_guest=True)
def set_user_password(email, password):
    """Set user password for GoCardless"""
    try:
        user = frappe.get_doc("User", email)
        user.db_set("new_password", password)
        user.save()
        frappe.db.commit()
        reset_password = frappe.get_doc("Email Template", "Reset User Password")
        context = {
            "user": user.first_name,
            "email": email,
            "password": password
        }
        subject = frappe.render_template(reset_password.subject, context)
        message = frappe.render_template(reset_password.response, context)
        frappe.sendmail(
            recipients=[email],
            subject=subject,
            message=message
        )
        frappe.local.response.http_status_code = 200
        return {
            "msg": "Password set successfully",
            "success": True
        }
    except Exception as e:
        frappe.log_error(f"Set User Password Error: {e}")
        frappe.local.response.http_status_code = 400
        return {
            "msg": "Failed to set password. Please try again.",
            "success": False
        }






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

@frappe.whitelist()
def get_customer_name_by_email(email):
    result = get_customer_by_email(email)
    if result and len(result) > 0:
        return result[0].get("name")   # return Customer.name
    else:
        return("Customer not found for this email")









def create_portal_user(doc, method):
    """Create portal user when a Customer is created."""

    # Skip if email not set
    if not doc.custom_email:
        frappe.throw("Custom Email is required to create a portal user")

    # Check if user already exists
    if frappe.db.exists("User", doc.custom_email):
        frappe.msgprint(f"User with email {doc.custom_email} already exists")
        return

    # Generate password
    password = random_string(10)

    # Create new User
    user = frappe.get_doc({
        "doctype": "User",
        "email": doc.custom_email,
        "first_name": doc.customer_name,
        "send_welcome_email": 0,
        "user_type": "Website User"  # portal user
    })
    user.insert(ignore_permissions=True)

    # Set password
    # frappe.utils.password.update_password(user.name, password)
    user = frappe.get_doc("User", user.name)
    if user:
        user.db_set("new_password", password)
        user.save()
        frappe.db.commit()

    # Save password back to customer field
    frappe.db.set_value("Customer", doc.name, "custom_portal_password", password)

    # Send welcome email
    send_welcome_email(doc, password)

    frappe.msgprint(f"Portal user created and welcome email sent to {doc.custom_email}")


def send_welcome_email(doc, password):
    """Send welcome email with email + password."""

    # Get template
    welcome_email_template = frappe.get_doc("Email Template", "Welcome Email")

    # Prepare context (include credentials)
    context = {
        "doc": doc,
        "email": doc.custom_email,
        "password": password
    }

    subject = frappe.render_template(welcome_email_template.subject, context)
    message = frappe.render_template(welcome_email_template.response, context)

    # Send email
    frappe.sendmail(
        recipients=[doc.custom_email],
        subject=subject,
        message=message,
        delayed=False
    )

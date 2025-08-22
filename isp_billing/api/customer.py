import frappe
from frappe.utils import random_string







# def create_portal_user(doc, method):
#     """Create portal user when a Customer is created."""

#     # Skip if email not set
#     if not doc.custom_email:
#         frappe.throw("Custom Email is required to create a portal user")

#     # Check if user already exists
#     if frappe.db.exists("User", doc.custom_email):
#         frappe.msgprint(f"User with email {doc.custom_email} already exists")
#         return

#     # Generate password
#     password = random_string(10)

#     # Create new User
#     user = frappe.get_doc({
#         "doctype": "User",
#         "email": doc.custom_email,
#         "first_name": doc.customer_name,
#         "send_welcome_email": 0,
#         "user_type": "Website User"  # portal user
#     })
#     user.insert(ignore_permissions=True)

#     # Set password
#     frappe.utils.password.update_password(user.name, password)

#     # Save password back to customer field
#     frappe.db.set_value("Customer", doc.name, "custom_portal_password", password)

#     frappe.msgprint(f"Portal user created for {doc.customer_name}")


# def send_welcome_email(doc, method):
   
#     welcome_email_template = frappe.get_doc("Email Template", "Welcome Email")

#     subject = welcome_email_template.subject
#     message = frappe.render_template(welcome_email_template.response, {"doc": doc})

#     frappe.sendmail(
#         recipients=[doc.custom_email],
#         subject=subject,
#         message=message,
#         delayed=False
#     )
    
#     return(f"Welcome email sent to {doc.custom_email} for Customer {doc.name}.")









import frappe
from frappe.utils import random_string


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

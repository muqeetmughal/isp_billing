import frappe
from frappe import _
from frappe.query_builder import DocType





@frappe.whitelist(allow_guest=True)
def get_issues(email):
    Issue = DocType("Issue")
    Customer = DocType("Customer")


    issues = (
        frappe.qb.from_(Issue)
            .join(Customer)
            .on(Issue.customer == Customer.name)
            .select(
                Issue.name,
                Issue.customer,
                Issue.subject,
                Issue.description,
                Issue.status,
                Issue.priority,
                Issue.custom_group,
                Issue.custom_type,
                Issue.custom_assigned_to,
                Issue.custom_watchers

            )
            .where(Customer.custom_email == email)
            .run(as_dict=True)
    )

    return issues





def get_isp_billing_settings():
    return frappe.get_single("Isp Billing Setting")

@frappe.whitelist(allow_guest=True)
def create_issue(subject, description, email, customer, issue_type, group, select_type):
    issue = frappe.get_doc({
        "doctype": "Issue",
        "subject": subject,
        "description": description,
        "status": "Open",
        "priority": "Medium",
        "raised_by": email,
        "customer": customer,
        "issue_type": issue_type,
        "custom_group": group,
        "custom_type": select_type
    })
    issue.insert(ignore_permissions=True)
    frappe.db.commit()

    # Get admin email from settings
    # settings = get_isp_billing_settings()
    # admin_email = settings.admin_email

    # # Send notification email to admin
    # frappe.sendmail(
    #     recipients=[admin_email],
    #     subject=f"New Issue Created: {subject}",
    #     message=f"""
    #         <p><strong>Subject:</strong> {subject}</p>
    #         <p><strong>Description:</strong> {description}</p>
    #         <p><strong>Customer:</strong> {customer}</p>
    #         <p><strong>Raised By:</strong> {email}</p>
    #         <p><strong>Issue Type:</strong> {issue_type}</p>
    #         <p><strong>Issue Link:</strong> <a href="{frappe.utils.get_url()}/app/issue/{issue.name}">{issue.name}</a></p>
    #     """
    # )

    frappe.local.response.http_status_code = 201

    return {
        "message": "Issue created successfully.",
        "issue_name": issue.name,
        "success": True
    }







@frappe.whitelist(allow_guest=True)
def get_issue_priority():
    
    Priority = DocType("Issue Priority")
    priorities = (
        frappe.qb.from_(Priority)
            .select(Priority.name)
            .run(as_dict=True)
    )   
    return priorities




@frappe.whitelist(allow_guest=True)
def get_issue_type():
    
    Type = DocType("Issue Type")
    type = (
        frappe.qb.from_(Type)
            .select(Type.name)
            .run(as_dict=True)
    )   
    return type





@frappe.whitelist(allow_guest=True)
def get_sales_invoice_details(invoice_number):
    SalesInvoice = DocType("Sales Invoice")
    invoice = frappe.get_all(
        SalesInvoice,
        filters={"name": invoice_number},
        fields=["name", "customer", "due_date", "grand_total", "status"]
    )

    if not invoice:
        frappe.throw(_("Sales Invoice not found."))

    frappe.local.response.http_status_code = 200

    return {
        "invoice_number": invoice[0].name,
        "customer": invoice[0].customer,
        "due_date": invoice[0].due_date,
        "grand_total": invoice[0].grand_total,
        "status": invoice[0].status
    }











# when issue create then it will send sla document to customer 
def get_isp_billing_settings():
    sla = frappe.get_single("Isp Billing Setting")
    return sla.sla_document

def send_sla_on_issue_create(doc, method):
    """Send SLA email with document when Issue is created"""
    if not doc.raised_by:
        return

    # Get SLA document
    sla_document = get_isp_billing_settings()

    # Get Email Template
    email_template = frappe.get_doc("Email Template", "Send SLA when Issue create")
    subject = frappe.render_template(email_template.subject, {"doc": doc})
    message = frappe.render_template(email_template.response, {"doc": doc})

    # Send mail with attachment
    attachments = []
    if sla_document:
        file_doc = frappe.get_doc("File", {"file_url": sla_document})
        attachments.append({"fname": file_doc.file_name, "fcontent": file_doc.get_content()})

    frappe.sendmail(
        recipients=[doc.raised_by],
        subject=subject,
        message=message,
        attachments=attachments,
        reference_doctype=doc.doctype,
        reference_name=doc.name
    )








# We need gocardless test access token that we use this to add any custmoer bank detail for test purpose
# please give me test access token for gocardless




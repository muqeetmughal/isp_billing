import os
import frappe
import base64
from docuseal import docuseal
from frappe.utils.pdf import get_pdf
from frappe.utils.file_manager import save_file




def get_docu_seal_token():
    setting = frappe.get_single("Docuseal Setting")
    return setting





"""Using the method we can send any document to the customer"""
@frappe.whitelist(allow_guest=True)
def send_docuseal_document(template_id, email):

    settings = get_docu_seal_token()
    token = settings.get("docuseal_api_token")


    # Configure DocuSeal client
    docuseal.key = token
    docuseal.url = "https://api.docuseal.com"

    # Create submission
    submission = docuseal.create_submission({
        # "template_id": 1619881, 
        "template_id": template_id,
        "message": {
            "subject": "Custom Subject",
            "body": "Custom Message {{submitter.link}}"
        },
        "submitters": [
            {
                # "email": "salmansaeed7272@gmail.com",
                "email": email
                # "role": "Director"
            }
        ]
    })

    frappe.local.response.http_statu_code = 201

    return {
        "status": "success",
        "data": submission
    }









def list_submission():

    settings = get_docu_seal_token()
    token = settings.get("docuseal_api_token")

    docuseal.key = token
    docuseal.url = "https://api.docuseal.com"

    data = docuseal.list_submissions({ "limit": 10 })

    # Filter only submissions with status 'completed'
    completed_submissions = [submission for submission in data.get("data", []) 
                             if submission.get("status") == "completed"]

    return {
        "data": completed_submissions
    }














@frappe.whitelist()
def create_docuseal_template(file_url, template_name):
    """
    Create a DocuSeal template from a PDF stored in Frappe.
    :param file_url: File URL (e.g. /files/test.pdf)
    :param template_name: Name of the template to create
    """

    # 1. Get API Token
    settings = get_docu_seal_token()
    token = settings.get("docuseal_api_token")

    if not token:
        frappe.throw("DocuSeal API Token is not configured in DocuSeal Settings")

    # 2. Configure DocuSeal client
    docuseal.key = token
    docuseal.url = "https://api.docuseal.com"

    # 3. Read file from Frappe's private/public files
    filename = file_url.replace("/files/", "")
    file_path = os.path.join(frappe.get_site_path("public", "files"), filename)

    if not os.path.exists(file_path):
        frappe.throw(f"File not found: {file_path}")

    with open(file_path, "rb") as f:
        pdf_data = f.read()

    # 4. Encode PDF as base64
    pdf_base64 = base64.b64encode(pdf_data).decode("utf-8")

    # 5. Call DocuSeal API
    submission = docuseal.create_template_from_pdf({
        "name": template_name,
        "documents": [
            {
                "name": "Uploaded PDF",
                "file": pdf_base64,
                "fields": [
                    {
                        "name": "signature",
                        "areas": [
                            {"x": 100, "y": 150, "w": 200, "h": 50, "page": 1}
                        ]
                    }
                ]
            }
        ]
    })

    frappe.local.response.http_status_code = 201

    return {
        "status" : "success",
        "data" : submission
    }






# this code give me the all list of templates 
@frappe.whitelist(allow_guest=True)
def get_template_list():
    settings = get_docu_seal_token()
    token = settings.get("docuseal_api_token")
    docuseal.key = token
    docuseal.url = "https://api.docuseal.com"

    data = docuseal.list_templates()  # Full response from API

    # Extract only id and name for each template
    templates = [
        {
            "id": template.get("id"),
            "name": template.get("name")
        }
        for template in data.get("data", [])
    ]

    return templates








"""
This method is used to save sales order print template in file and also create template in the
docuseal 
"""
@frappe.whitelist()
def attach_sales_order_pdf(docname, print_format=None):
    """Generate Sales Order PDF with selected print format, attach as File, send to DocuSeal, and store template_id"""
    doc = frappe.get_doc("Sales Order", docname)

    # Step 1: Render PDF
    pdf_data = get_pdf(frappe.get_print("Sales Order", doc.name, print_format or "Standard"))

    # Step 2: Save PDF in File doctype
    filedoc = save_file(
        f"{doc.name}.pdf",
        pdf_data,
        "Sales Order",
        doc.name,
        is_private=0   # must be public so we can fetch file via /files/
    )

    # Step 3: Build template name (Customer Name + Subscription Plan)
    template_name = f"{doc.customer_name} - {doc.custom_subscription_plan}"

    # Step 4: Send file to DocuSeal
    template_id = None
    try:
        res = create_docuseal_template(filedoc.file_url, template_name)
        template_id = res.get("data", {}).get("id")   # DocuSeal template ID

        # Step 5: Store template_id in Sales Order (custom field required)
        if template_id:
            doc.db_set("custom_docuseal_template_id", template_id)
            frappe.logger().info(f"DocuSeal Template Created for SO {doc.name}: {template_id}")

    except Exception as e:
        frappe.log_error(f"DocuSeal Error for Sales Order {doc.name}: {str(e)}")

    return {
        "file_id": filedoc.name,
        "docuseal_template_id": template_id
    }











"""
This is the webhook code that tell us when customer signed the document.
"""
@frappe.whitelist(allow_guest=True)  # DocuSeal will call without auth
def docuseal_webhook():
    """
    Webhook endpoint for DocuSeal to update Sales Order on submission completed.
    """
    try:
        data = frappe.request.get_json()  # Proper JSON payload
        frappe.logger("docuseal").info(f"Webhook received: {data}")

        event_type = data.get("event_type")
        submission = data.get("data", {})

        # Extract values
        template_id = None
        status = None

        if submission:
            template_id = submission.get("template", {}).get("id")
            status = submission.get("status")

        if not template_id or not status:
            return {"status": "error", "message": "Invalid payload"}

        # Only act on submission completed
        if event_type == "submission.completed" and status.lower() == "completed":
            # Find Sales Order with this template_id
            so_name = frappe.get_value("Sales Order", {"custom_docuseal_template_id": str(template_id)}, "name")

            if so_name:
                frappe.db.set_value("Sales Order", so_name, "custom_e_sign_status", "Completed")
                frappe.db.commit()
                return {"status": "success", "message": f"Sales Order {so_name} updated"}

        return {"status": "ignored", "message": f"Event {event_type} with status {status}"}

    except Exception as e:
        frappe.log_error(f"DocuSeal Webhook Error: {str(e)}")
        return {"status": "error", "message": str(e)}



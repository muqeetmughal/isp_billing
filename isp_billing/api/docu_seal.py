import os
import frappe
import base64
from docuseal import docuseal
from frappe.query_builder import DocType



def get_docu_seal_token():
    setting = frappe.get_single("Docuseal Setting")
    return setting





@frappe.whitelist(allow_guest=True)
def get_template():
    setting = frappe.get_single("Docuseal Setting")
    template_list = setting.get("docuseal_template_ids", [])

    # Extract only template_id and description
    filtered_templates = [
        {
            "template_id": template.get("template_id"),
            "description": template.get("description")
        }
        for template in template_list
    ]

    return filtered_templates





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

    docuseal.key = "uvhBRFEQcWVTJ1exku5K3UzqPKnQNgcxRsiq4EdUNb9"
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




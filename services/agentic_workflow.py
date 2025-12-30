from services.agents import workflow
from services.ai_service import encode_images_to_base64
from langchain.messages import HumanMessage
import uuid
import logging

def process_images_and_generate_report(data_folder, phone_details):
    """
    Encode images, prepare messages, generate thread_id, and invoke the workflow to get the report and final price.
    
    :param data_folder: Path to the folder containing images
    :param phone_details: Dict with phone details
    :return: Tuple of (report, thread_id, final_price)
    """
    logging.info(f"Processing images in {data_folder} with details: {phone_details}")
    
    # Encode images to base64
    encoded_images = encode_images_to_base64(data_folder)
    logging.debug(f"Encoded {len(encoded_images)} images")
    
    # Prepare messages for the vision agent with base64 images
    content = [{"type": "text", "text": "Analyze these images for the mobile phone condition and generate a report for price detection."}]
    for filename, base64_str in encoded_images.items():
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64_str}"}
        })
    
    messages = [HumanMessage(content=content)]
    
    # Generate unique thread_id for this request
    thread_id = f"phone_{uuid.uuid4().hex[:8]}"
    logging.info(f"Generated thread_id: {thread_id}")
    
    try:
        # Invoke the workflow
        workflow_result = workflow.invoke(
            {"messages": messages, "thread_id": thread_id, "phone_details": phone_details}
        )
        report = workflow_result["vision_report"]
        final_price = workflow_result["final_price"]
        logging.info(f"Workflow completed for thread_id: {thread_id}")
    except Exception as e:
        logging.error(f"Error in workflow for thread_id {thread_id}: {str(e)}")
        report = f"Error generating report: {str(e)}"
        final_price = None
    
    return report, thread_id, final_price

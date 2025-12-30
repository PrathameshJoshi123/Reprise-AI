import os
from ultralytics import YOLO

# Load the YOLO model (using a pre-trained model; adjust path if needed)
model = YOLO('../best.pt')  # You can change to a custom model path

def detect_and_save(image_path, output_filename='result.jpg'):
    """
    Perform object detection on the given image and save the annotated result to the data folder.
    
    :param image_path: Path to the input image
    :param output_filename: Name for the output file (default: 'result.jpg')
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    # Create data folder if it doesn't exist
    data_folder = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_folder, exist_ok=True)
    
    # Perform prediction
    results = model.predict(source=image_path, save=False)  # Predict without auto-saving
    
    # Save the annotated image to the data folder
    output_path = os.path.join(data_folder, output_filename)
    results[0].save(output_path)  # Save the first result (assuming single image)
    
    print(f"Annotated image saved to: {output_path}")
    return output_path

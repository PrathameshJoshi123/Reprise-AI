import os
import base64

def encode_images_to_base64(data_folder='data'):
    """
    Encode all images in the specified data folder to base64.
    
    :param data_folder: Path to the folder containing images (default: 'data')
    :return: Dictionary with image filenames as keys and base64 encoded strings as values
    """
    encoded_images = {}
    if not os.path.exists(data_folder):
        raise FileNotFoundError(f"Data folder not found: {data_folder}")
    
    for file in os.listdir(data_folder):
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            file_path = os.path.join(data_folder, file)
            with open(file_path, 'rb') as f:
                encoded_images[file] = base64.b64encode(f.read()).decode('utf-8')
    
    return encoded_images


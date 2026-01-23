from langchain.tools import tool
from ddgs import DDGS
import os
import csv

@tool
def search(query: str) -> str:
    """Search for information using DuckDuckGo."""
    with DDGS() as ddgs:
        results = ddgs.text(query, max_results=5, backend="brave, google, wikipedia")
        if results:
            return "\n".join([f"{r['title']}: {r['body']}" for r in results])
        return f"No results found for: {query}"

@tool
def get_phone_prices(brand=None, series=None, model=None, storage_raw=None, ram_gb=None, internal_storage_gb=None):
    """
    Fetch original and selling prices from the CSV based on provided phone details.
    Matches rows where provided fields align (case-insensitive for strings, exact for numbers).
    Handles missing fields by ignoring them in the match.
    
    :param brand: Phone brand (optional)
    :param series: Phone series (optional)
    :param model: Phone model (optional)
    :param storage_raw: Raw storage string (optional)
    :param ram_gb: RAM in GB (optional)
    :param internal_storage_gb: Internal storage in GB (optional)
    :return: Dict with 'original_price' and 'selling_price' if a match is found, else None
    """
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'final_mobile_master_data.csv')
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    matches = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            match = True
            if brand and row['Brand'].lower() != brand.lower():
                match = False
            if series and row['Series'].lower() != series.lower():
                match = False
            if model and row['Model'].lower() != model.lower():
                match = False
            if storage_raw and row['Storage_Raw'] != storage_raw:
                match = False
            if ram_gb is not None and row['RAM_GB'] and float(row['RAM_GB']) != ram_gb:
                match = False
            if internal_storage_gb is not None and row['Internal_Storage_GB'] and int(row['Internal_Storage_GB']) != internal_storage_gb:
                match = False
            if match:
                matches.append(row)
    
    if matches:
        # Return prices from the first match (or could average if multiple, but using first for simplicity)
        return {
            'original_price': float(matches[0]['Original_Price']) if matches[0]['Original_Price'] else None,
            'selling_price': float(matches[0]['Selling_Price']) if matches[0]['Selling_Price'] else None
        }
    return None



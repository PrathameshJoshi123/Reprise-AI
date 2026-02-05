"""
Script to populate image links from phones.csv into the database.
Run this script after running Alembic migrations.

Usage: python populate_phone_images.py
"""

import csv
import os
import sys
from pathlib import Path

# Add the project root directory to path for imports
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from backend.shared.db.connections import SessionLocal, engine
from backend.services.sell_phone.schema.models import PhoneList, Base

# Ensure all tables exist
Base.metadata.create_all(bind=engine)


def populate_phone_images_from_csv():
    """
    Read phones.csv and populate image_url for matching phone models in the database.
    
    The CSV has columns: brand, model, variant, price, link
    We match by Brand and Model, and store the image URL.
    """
    csv_path = project_root / "phones.csv"
    
    if not csv_path.exists():
        print(f"Error: phones.csv not found at {csv_path}")
        return False
    
    db = SessionLocal()
    try:
        # Create a mapping of (brand, model) -> image_url from CSV
        brand_model_to_url = {}
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                brand = row.get('brand', '').strip()
                model = row.get('model', '').strip()
                link = row.get('link', '').strip()
                
                if brand and model and link:
                    # Use the first occurrence of each brand-model combo
                    key = (brand.lower(), model.lower())
                    if key not in brand_model_to_url:
                        brand_model_to_url[key] = link
        
        if not brand_model_to_url:
            print("Warning: No valid records found in phones.csv")
            return False
        
        print(f"Found {len(brand_model_to_url)} unique brand-model combinations in CSV")
        
        # Query all phones in database and update with image URLs
        phones = db.query(PhoneList).all()
        updated_count = 0
        
        for phone in phones:
            key = (phone.Brand.lower(), phone.Model.lower())
            
            if key in brand_model_to_url:
                phone.image_url = brand_model_to_url[key]
                updated_count += 1
        
        # Commit all updates
        if updated_count > 0:
            db.commit()
            print(f"\nSuccessfully updated {updated_count} phones with image URLs")
        else:
            print("\nWarning: No phones were matched and updated")
            # Show sample of what we're looking for vs what's in DB
            if phones:
                sample_phone = phones[0]
                print(f"\nSample from DB: Brand='{sample_phone.Brand}', Model='{sample_phone.Model}'")
                print(f"Sample from CSV keys: {list(brand_model_to_url.keys())[:3]}")
        
        return updated_count > 0
    
    except Exception as e:
        print(f"Error during population: {str(e)}")
        db.rollback()
        return False
    
    finally:
        db.close()


def verify_population():
    """Verify that images have been populated."""
    db = SessionLocal()
    try:
        total_phones = db.query(PhoneList).count()
        phones_with_images = db.query(PhoneList).filter(
            PhoneList.image_url.isnot(None)
        ).count()
        
        print(f"\n--- Verification ---")
        print(f"Total phones in database: {total_phones}")
        print(f"Phones with image URLs: {phones_with_images}")
        
        if total_phones > 0:
            percentage = (phones_with_images / total_phones) * 100
            print(f"Coverage: {percentage:.1f}%")
        
        return phones_with_images > 0
    
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Populating phone images from CSV")
    print("=" * 60)
    
    success = populate_phone_images_from_csv()
    
    if success:
        verify_population()
        print("\n✓ Image population completed successfully!")
    else:
        print("\n✗ Image population failed or found no matches")
        sys.exit(1)

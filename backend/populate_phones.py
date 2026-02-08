"""
Script to populate the phones_list table with data from CSV files.
Supports both final_mobile_master_data.csv and phones.csv
"""

import csv
import os
from pathlib import Path
from sqlalchemy.orm import sessionmaker
from backend.services.sell_phone.schema.models import PhoneList
from backend.shared.db.connections import engine

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def populate_from_final_mobile_master_data(csv_path: str, limit: int = None) -> int:
    """
    Populate from final_mobile_master_data.csv
    Columns: Brand, Series, Model, Storage_Raw, Original_Price, Selling_Price, RAM_GB, Internal_Storage_GB
    """
    session = SessionLocal()
    try:
        count = 0
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if limit and count >= limit:
                    break
                
                try:
                    phone = PhoneList(
                        Brand=row.get('Brand', '').strip(),
                        Series=row.get('Series', '').strip(),
                        Model=row.get('Model', '').strip(),
                        Storage_Raw=row.get('Storage_Raw', '').strip(),
                        Original_Price=float(row['Original_Price']) if row.get('Original_Price') and row.get('Original_Price').strip() else None,
                        Selling_Price=float(row['Selling_Price']) if row.get('Selling_Price') and row.get('Selling_Price').strip() else 0.0,
                        RAM_GB=float(row['RAM_GB']) if row.get('RAM_GB') and row.get('RAM_GB').strip() else None,
                        Internal_Storage_GB=float(row['Internal_Storage_GB']) if row.get('Internal_Storage_GB') and row.get('Internal_Storage_GB').strip() else 0.0,
                        image_url=None,
                        image_blob=None
                    )
                    session.add(phone)
                    count += 1
                except (ValueError, KeyError) as e:
                    print(f"Error processing row {count + 1}: {e}")
                    continue
                
                if count % 100 == 0:
                    session.commit()
                    print(f"Committed {count} records from final_mobile_master_data.csv")
        
        session.commit()
        print(f"Successfully loaded {count} records from final_mobile_master_data.csv")
        return count
    
    except FileNotFoundError:
        print(f"File not found: {csv_path}")
        return 0
    except Exception as e:
        session.rollback()
        print(f"Error loading final_mobile_master_data.csv: {e}")
        return 0
    finally:
        session.close()


def populate_from_phones_csv(csv_path: str, limit: int = None) -> int:
    """
    Populate from phones.csv
    Columns: brand, model, variant, price, link
    Maps to: Brand, Model, Storage_Raw, Selling_Price, image_url
    """
    session = SessionLocal()
    try:
        count = 0
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if limit and count >= limit:
                    break
                
                try:
                    phone = PhoneList(
                        Brand=row.get('brand', '').strip(),
                        Series='',  # Not available in phones.csv
                        Model=row.get('model', '').strip(),
                        Storage_Raw=row.get('variant', '').strip(),
                        Original_Price=None,  # Not available in phones.csv
                        Selling_Price=float(row['price']) if row.get('price') and row.get('price').strip() else 0.0,
                        RAM_GB=None,  # Not available in phones.csv
                        Internal_Storage_GB=0.0,  # Not available in phones.csv
                        image_url=row.get('link', '').strip() if row.get('link') else None,
                        image_blob=None
                    )
                    session.add(phone)
                    count += 1
                except (ValueError, KeyError) as e:
                    print(f"Error processing row {count + 1}: {e}")
                    continue
                
                if count % 100 == 0:
                    session.commit()
                    print(f"Committed {count} records from phones.csv")
        
        session.commit()
        print(f"Successfully loaded {count} records from phones.csv")
        return count
    
    except FileNotFoundError:
        print(f"File not found: {csv_path}")
        return 0
    except Exception as e:
        session.rollback()
        print(f"Error loading phones.csv: {e}")
        return 0
    finally:
        session.close()


def clear_phone_list():
    """Clear all records from phones_list table"""
    session = SessionLocal()
    try:
        session.query(PhoneList).delete()
        session.commit()
        print("Cleared all records from phones_list table")
    except Exception as e:
        session.rollback()
        print(f"Error clearing phones_list table: {e}")
    finally:
        session.close()


def main():
    """
    Main function to populate the database
    """
    import sys
    
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    
    # CSV file paths
    final_mobile_csv = project_root / "final_mobile_master_data.csv"
    phones_csv = project_root / "phones.csv"
    
    print("Phone Database Population Script")
    print("=" * 50)
    
    # Check if files exist
    if not final_mobile_csv.exists():
        print(f"Warning: {final_mobile_csv} not found")
    
    if not phones_csv.exists():
        print(f"Warning: {phones_csv} not found")
    
    # Clear existing data
    user_input = input("Clear existing phone data? (yes/no): ").strip().lower()
    if user_input == 'yes':
        clear_phone_list()
    
    total_loaded = 0
    
    # Load from final_mobile_master_data.csv
    if final_mobile_csv.exists():
        print(f"\nLoading from {final_mobile_csv.name}...")
        count = populate_from_final_mobile_master_data(str(final_mobile_csv))
        total_loaded += count
    
    # Load from phones.csv
    if phones_csv.exists():
        print(f"\nLoading from {phones_csv.name}...")
        count = populate_from_phones_csv(str(phones_csv))
        total_loaded += count
    
    print("\n" + "=" * 50)
    print(f"Total records loaded: {total_loaded}")


if __name__ == "__main__":
    main()

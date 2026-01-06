import streamlit as st
import requests

# Point this to your FastAPI backend
API_URL = "http://127.0.0.1:8000/calculate-price"

st.set_page_config(page_title="RePrice AI", page_icon="📱")

# Header
st.title("📱 RePrice AI")
st.markdown("### Intelligent Used Phone Valuation System")
st.info("Uses **RAG (Retrieval Augmented Generation)** & **Agentic AI** to find real market prices.")

# --- SIDEBAR (Context) ---
with st.sidebar:
    st.header("How it works")
    st.markdown("""
    1. **Search:** We look up your phone in our Vector Database.
    2. **Filter:** We match the specific RAM/Storage variant.
    3. **AI Appraisal:** Our Agent analyzes the specific damage type to calculate a fair deduction.
    """)

# --- INPUT FORM ---
with st.form("pricing_form"):
    st.subheader("1. Device Details")
    # Split input to help user format it correctly
    model_base = st.text_input("Model Name", placeholder="e.g. Realme 13 Pro Plus")
    variant_spec = st.text_input("Variant (RAM/Storage)", placeholder="e.g. 8/128")
    
    st.subheader("2. Condition Assessment")
    col1, col2 = st.columns(2)
    
    with col1:
        # UPDATED: Granular Condition Tiers matching Backend Logic
        screen_cond = st.selectbox(
            "Screen Condition", 
            ["Good", "Minor Scratches", "Major Scratches", "Cracked", "Shattered"],
            help="Minor: Light marks. Major: Deep grooves. Cracked: Hairline crack. Shattered: Spiderweb/Glass missing."
        )
        # NEW INPUT: Warranty
        is_warranty = st.checkbox("Still under Brand Warranty?")
        
    with col2:
        turns_on = st.checkbox("Device Turns On?", value=True)
        has_box = st.checkbox("Have Original Box?", value=True)
        # NEW INPUT: Bill
        has_bill = st.checkbox("Have Original Bill?", value=True)
        
    submitted = st.form_submit_button("Get Instant Quote 🚀")

# --- RESULTS ---
if submitted:
    if not model_base:
        st.error("Please enter a phone model!")
    else:
        # Combine inputs into the format our backend expects
        # If user entered variant, combine with comma: "Model, Variant"
        full_model_query = model_base
        if variant_spec:
            full_model_query = f"{model_base}, {variant_spec}"
            
        payload = {
            "model_name": full_model_query,
            "turns_on": turns_on,
            "screen_condition": screen_cond,
            "has_box": has_box,
            "has_bill": has_bill,             # <--- Added
            "is_under_warranty": is_warranty  # <--- Added
        }
        
        # Call API
        with st.spinner("🤖 AI is analyzing market rates & damage severity..."):
            try:
                response = requests.post(API_URL, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    final_p = data.get('final_price')
                    
                    if final_p is not None:
                        st.balloons()
                        st.success(" Valuation Complete!")
                        
                        # Big Price Display
                        st.metric(
                            label="Final Offer Price", 
                            value=f"₹{final_p:,.2f}",
                            delta=f"Base Market Value: ₹{data.get('base_price'):,.2f}"
                        )
                        
                        # Logs (Transparency)
                        with st.expander("🔍 See AI Reasoning Logic", expanded=True):
                            for log in data.get('logs', []):
                                log_lower = log.lower()
                                if "deducted" in log_lower or "not found" in log_lower or "missing" in log_lower or "❌" in log:
                                    st.markdown(f"❌ {log}")
                                elif "ai applied" in log_lower or "bonus" in log_lower:
                                    st.markdown(f"🧠 **{log}**") # Highlight AI decisions
                                else:
                                    st.markdown(f"✅ {log}")
                    else:
                        st.warning("Could not calculate a price. Please check the model name.")
                        st.write(data.get('logs'))
                        
                else:
                    st.error(f"Server Error: {response.text}")
                    
            except requests.exceptions.ConnectionError:
                st.error("❌ Connection Failed. Is the backend running?")
                st.code("uvicorn backend.main:app --reload")
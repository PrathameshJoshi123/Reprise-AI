import os
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

def get_mistral_chain():
    # Initialize MistralAI model via LangChain
    llm = ChatMistralAI(
        model="mistral-small-latest",  # Use appropriate Mistral model
        api_key=os.getenv("MISTRAL_API_KEY"),  # Set via env var
        temperature=0.1  # Low temperature for consistent pricing
    )
    
    # Define prompt template using modern from_template
    prompt_template = PromptTemplate.from_template("""
You are a phone resale valuation engine used in a production system.
You must follow ALL rules below with ZERO exceptions.

======================
CRITICAL ENFORCEMENT RULES
======================
1. The provided Base Price is the ABSOLUTE MAXIMUM value.
2. The final predicted_price MUST be LESS THAN OR EQUAL TO the Base Price.
3. You are STRICTLY FORBIDDEN from outputting any value higher than the Base Price.
4. All calculations MUST start ONLY from the Base Price.
5. You MUST NOT introduce, infer, assume, or reference any other price.
6. You MUST NOT apply any positive adjustment, bonus, premium, or increase.
7. If no deductions apply, predicted_price MUST be EXACTLY equal to the Base Price.
8. Violating ANY rule makes the output invalid.

======================
PHONE DETAILS
======================
Brand: {brand}
Model: {model}
RAM: {ram_gb} GB
Storage: {storage_gb} GB
Screen Condition: {screen_condition}
Device Turns On: {device_turns_on}
Original Box Available: {has_original_box}
Original Bill Available: {has_original_bill}

======================
BASE PRICE (MAX VALUE)
======================
Base Price: ₹{base_price}

======================
VALUATION PROCESS (MANDATORY)
======================
1. Start valuation strictly from the Base Price.
2. Apply ONLY downward deductions based on:
   - Screen condition
   - Device power / functionality
   - Missing original box
   - Missing original bill
3. Each deduction MUST reduce the price.
4. If the device does NOT turn on, apply a MAJOR deduction.
5. NEVER add value for good condition or accessories.
6. NEVER reference market prices, demand, or resale platforms.

======================
REASONING RULES (STRICT)
======================
- Explain ONLY the deductions applied.
- If no deductions apply, explicitly state that no deductions were applied.
- Do NOT mention market trends, demand, competitors, platforms, or assumptions.
- Keep reasoning short and customer-friendly.

======================
OUTPUT FORMAT (STRICT JSON ONLY)
======================
Return ONLY a valid JSON object in the following format:

{{
  "predicted_price": <number <= base_price>,
  "reasoning": "<brief explanation of deductions only>"
}}

IMPORTANT:
- Output MUST be valid JSON.
- Do NOT include currency symbols.
- Do NOT include markdown.
- Do NOT include extra keys.
- Do NOT include any text outside the JSON object.
""")
    
    # Build the chain using the pipe operator
    chain = prompt_template | llm | JsonOutputParser()
    return chain

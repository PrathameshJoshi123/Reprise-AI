import os
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

def get_mistral_chain():
    # Initialize MistralAI model via LangChain
    llm = ChatMistralAI(
        model="mistral-medium-latest",  # Use appropriate Mistral model
        api_key=os.getenv("MISTRAL_API_KEY"),  # Set via env var
        temperature=0.1  # Low temperature for consistent pricing
    )
    
    # Define prompt template using modern from_template
    prompt_template = PromptTemplate.from_template("""
        You are an expert in phone resale valuation.

        IMPORTANT RULES (MUST FOLLOW STRICTLY):
        1. The Base Price provided is the MAXIMUM POSSIBLE price.
        2. The predicted resale price MUST ALWAYS be LESS THAN OR EQUAL TO the Base Price.
        3. Under NO circumstances should the predicted price exceed the Base Price.
        4. All calculations, deductions, and adjustments must start ONLY from the given Base Price.
        5. Do NOT assume, estimate, or introduce any other base price or market price.

        Phone Details:
        - Brand: {brand}
        - Model: {model}
        - RAM: {ram_gb} GB
        - Storage: {storage_gb} GB
        - Screen Condition: {screen_condition}
        - Device Turns On: {device_turns_on}
        - Original Box: {has_original_box}
        - Original Bill: {has_original_bill}

        Base Price: ₹{base_price}

        Valuation Instructions:
        - Begin valuation strictly from the Base Price.
        - Apply ONLY downward deductions based on condition, functionality, and missing accessories.
        - If the device is in perfect condition, the price may equal the Base Price, but NEVER exceed it.
        - Do not add premiums or positive adjustments.

        Reasoning Guidelines:
        - Explain ONLY the deductions applied and why they were applied.
        - Do NOT mention competitors, market trends, demand, resale platforms, or external pricing.
        - Keep reasoning simple, transparent, and customer-friendly.

        Output Format (STRICT):
        Predicted Price: ₹[final amount ≤ base price]
        Reasoning: [brief explanation of deductions only]
        """)
    
    # Build the chain using the pipe operator
    chain = prompt_template | llm | StrOutputParser()
    return chain

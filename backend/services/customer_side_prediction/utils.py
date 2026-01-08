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
        You are an expert in phone valuation. Based on the following phone details and base price, predict a fair resale price in INR.
        Strictly adhere to the base price provided and make calculations accordingly.
        Do not assume any other base price.
                                                   
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
        
        Consider market trends, depreciation, and condition factors. Provide a predicted price and brief reasoning.
        
        Output format:
        Predicted Price: [number in INR]
        Reasoning: [brief explanation]
        """)
    
    # Build the chain using the pipe operator
    chain = prompt_template | llm | StrOutputParser()
    return chain

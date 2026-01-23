import os
from dotenv import load_dotenv
from typing import TypedDict

load_dotenv()

from langchain_mistralai import ChatMistralAI
from langchain.agents import create_agent
from langchain.messages import SystemMessage, HumanMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import StateGraph, START, END
from tools import search, get_phone_prices

# Global checkpointer
checkpointer = InMemorySaver()

# Define the State for the workflow
class State(TypedDict):
    messages: list
    vision_report: str
    final_price: str
    phone_details: dict

# Initialize the chat model from Mistral using LangChain
vision_llm = ChatMistralAI(
    model="ministral-8b-2512",
    temperature=0,
    max_retries=2,
    # other params...
)

# Create an agent using the same LLM (assuming 'tools' is defined elsewhere)
vision_agent = create_agent(
    vision_llm,
    system_prompt=SystemMessage(
        content=[
            {
                "type": "text",
                "text": "You are the \"Vision Inspection Agent.\" Your role is to extract and quantify physical damage from 12 mobile phone images (6 sides, Original + YOLO). Your output will be used by a Pricing Agent to determine final resale value.\n\n### EXTRACTION OBJECTIVES:\nFor each side, identify and categorize:\n1. PERMANENT DAMAGE: Scratches, cracks, chips, or dents. (High impact on price).\n2. TEMPORARY DEFECTS: Stains, oil, or dust. (Low impact, categorized as \"cleaning required\").\n3. CONFIDENCE DATA: Use YOLO confidence scores to weight the reliability of the defect.\n\n### OUTPUT REQUIREMENTS (To be passed to Pricing Agent):\nFor every analysis, you must provide a \"Device Condition Data Block\" followed by a brief technical summary:\n\n1. [CONDITION DATA BLOCK]:\n- Front_Grade: [Mint/Good/Fair/Poor] | Detected: [e.g., Scratches 0.83, Stains 0.77]\n- Back_Grade: [Grade] | Detected: [Items]\n- Frame_Edges: [Grade] | Detected: [Items]\n- Permanent_Damage_Score: [1-10 scale, 10 being destroyed]\n- Refurbishment_Required: [Yes/No]\n\n2. [TECHNICAL CONTEXT]:\n- Summarize the \"Damage Density\" (e.g., \"Heavy micro-scratching on the bottom-right quadrant of the front glass\").\n- Note any specific risks to functionality (e.g., \"Scratches near the front-facing camera may affect photo quality\").\n\n### CONSTRAINTS:\n- Do not estimate dollar amounts (leave this to the Pricing Agent).\n- Focus on objective physical evidence.\n- If images for a side are missing, flag them as \"Not Inspected.\"",
            }
        ]
    ),
    checkpointer=checkpointer,
)

# Initialize the pricing LLM
pricing_llm = ChatMistralAI(
    model="mistral-medium-2508",
    temperature=0,
    max_retries=2,
    # other params...
)

# Create the pricing agent with tools
pricing_agent = create_agent(
    pricing_llm,
    tools=[search, get_phone_prices],
    system_prompt=SystemMessage(
        content=[
            {
                "type": "text",
                "text": "Role: You are the \"Master Pricing Appraiser.\" Your goal is to synthesize physical vision data, functional health, and market desirability to produce a final buyback price that mirrors professional refurbishment standards.\n\nInput Data Points:\nCore Profile: Brand, Model, Storage (GB), and Device Age.\nDB Anchor Prices: Original Launch Price vs. Current Database Selling Price.\nVision Report: Detected scratches, dents, cracks, or missing buttons.\nFunctional Questionnaire: Status of Biometrics, Display (lines/spots), Battery Health %, and Connectivity.\nAccessories & Paperwork: Presence of Original Box, Original Charger, and Valid GST Bill.\nMarket Intelligence: Real-time web results for \"used price\" and \"repair part costs.\"\n\nTASKS & LOGIC:\n1. Establish the \"Base Value\" (The Core)\nDepreciation Curve: Calculate value based on age. (e.g., Year 1: -40%, Year 2: -60%).\nBrand Weight: Apply a \"Resale Premium\" for high-demand brands (Apple/Samsung S-series) vs. higher depreciation for budget brands.\nStorage Bonus: Ensure the 256GB/512GB variants are priced higher than base models using the DB anchor.\n\n2. Functional & Display \"Organs\" Check\nDisplay Quality: Check for \"AMOLED burn-in,\" \"green lines,\" or \"dead pixels.\" These are Major Deductions.\nBiometric Failures: If FaceID/Fingerprint is broken, apply a 40% penalty on the base price (high security-chip repair cost).\nBattery Health: If <80%, deduct the cost of a battery replacement.\n\n3. Cosmetic Grading (Vision Integration)\nAnalyze the Vision Report for:\nBody: Scratches (Minor) vs. Dents/Bent Frame (Major).\nScreen Glass: Cracked glass but working touch = \"Cracked Grade\" (Deduct glass replacement cost).\nMissing Parts: Check if Power/Volume buttons are missing.\n\n4. The \"Trust\" Premium\nValue Adds: If the user has the Original Box + Original Charger + Valid Bill, add a 10-15% bonus to the final quote. This confirms ownership and reduces resale friction.\n\nCALCULATION FORMULA:\nFinal Price = [(Anchor Price - Functional Penalties - Cosmetic Repairs) × (Market Modifier)] + (Accessory Bonus)\n\nOUTPUT STRUCTURE:\n1. Device Identity & Baseline\nModel & Variant: [e.g., iPhone 14 128GB - Blue]\nDevice Age: [Months/Years]\nAnchor DB Price: [Amount]\n\n2. Technical Health Audit\nDisplay & Touch: [Status & Deduction]\nBiometrics & Connectivity: [Status & Deduction]\nBattery & Internal Organs: [Status & Deduction]\n\n3. Cosmetic & Vision Review\nVision Findings: [Scratches/Dents/Missing Buttons]\nVisual Grade: [A/B/C/D]\nRepair Cost Deduction: [Amount based on web search]\n\n4. Documentation & Extras\nTrust Factors: [Box/Bill/Charger present?]\nBonus Applied: [+Amount]\n\n5. Final Resale Offer\nFinal Quote: [Currency & Amount]\nReasoning: A concise justification of the price based on current market demand and repair feasibility.",
            }
        ]
    ),
    checkpointer=checkpointer,
)

def agent_node(state: State) -> dict:
    """A LangGraph node that invokes the vision agent."""
    result = vision_agent.invoke(
        {"messages": state["messages"]},
        config={"configurable": {"thread_id": state.get("thread_id")}}
    )
    return {"vision_report": result['messages'][-1].content}

def pricing_node(state: State) -> dict:
    """A LangGraph node that invokes the pricing agent."""
    details = state["phone_details"]
    content = f"Phone details: {details}\nVision Report: {state['vision_report']}\nDetermine the final price."
    messages = [HumanMessage(content=content)]
    result = pricing_agent.invoke(
        {"messages": messages},
        config={"configurable": {"thread_id": state.get("thread_id")}}
    )
    return {"final_price": result['messages'][-1].content}

# Build the workflow
workflow = (
    StateGraph(State)
    .add_node("vision", agent_node)
    .add_node("pricing", pricing_node)
    .add_edge(START, "vision")
    .add_edge("vision", "pricing")
    .add_edge("pricing", END)
    .compile()
)



import sys
import os

# Add the backend directory to sys.path so we can import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.pdf_gen import create_pdf_buffer

def test_generate_pdf():
    mock_data = {
        "full_name": "JOHNATHON WATSON",
        "contact_info": "jwatson@gmail.com | (123) 456-7890 | linkedin.com/in/jwatson",
        "summary": "Prospect and close new business for 1000+ SaaS software corporation. Exceeded expectations with 137% average quota attainment across all sales tenures. Won 'Rising Star' award for most deals closed and largest deal closed for a first year salesperson at HubSpot.",
        "skills": ["Microsoft Office", "Social Media Marketing", "Facebook Ads", "Content Marketing", "SEO", "Salesforce", "Cold Calling"],
        "education": "BA, Marketing\nUniversity of Georgia\n2008 - June 2012", # Using string for now as per current logic, or adapt if structure changes
        "experience": [
            {
                "role": "ACCOUNT EXECUTIVE",
                "company": "Hubspot",
                "duration": "July 2017 - November 2019",
                "points": [
                    "Prospect and close new business for $500M+ SaaS software corporation",
                    "Average 105% quota attainment over the past two years",
                    "Manage a team of two Sales Development Representatives to prospect and qualify leads"
                ]
            },
            {
                "role": "ASSOCIATE ACCOUNT EXECUTIVE",
                "company": "Salesforce",
                "duration": "August 2016 - June 2017",
                "points": [
                    "Prospected and qualified leads for Salesforce's Technology vertical",
                    "Maintained average quota attainment of 100% across B2B book of business",
                    "Spearheaded new onboarding and training process for new Sales Development Representatives"
                ]
            },
             {
                "role": "SALES DEVELOPMENT EXECUTIVE",
                "company": "Taboola",
                "duration": "April 2013 - July 2019",
                "points": [
                    "Prospected highly qualified leads via cold calling and cold email for Enterprise clients",
                    "Maintained highest lead-to-close ratio on my team",
                    "Helped create process documentation for new SDR hires"
                ]
            }
        ]
    }
    
    # We might need to adjust mock_data if the new pdf_gen expects strictly structured education
    # For now, let's assume we handle text parsing or just pass strings
    
    print("Generating PDF...")
    try:
        buffer = create_pdf_buffer(mock_data)
        output_filename = "test_resume.pdf"
        with open(os.path.join(os.path.dirname(__file__), output_filename), "wb") as f:
            f.write(buffer.getvalue())
        print(f"Success! PDF saved to {output_filename}")
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generate_pdf()

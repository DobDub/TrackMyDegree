from bs4 import BeautifulSoup
from bs4.dammit import EncodingDetector
import json
import requests
import re

# URL of the Concordia Computer Science courses page

url= "https://www.concordia.ca/academics/undergraduate/calendar/current/section-31-faculty-of-arts-and-science/section-31-110-departement-d-etudes-francaises/cours-d-etudes-francaises.html"

response = requests.get(url)
if response.status_code != 200:
    print(f"Failed to fetch the webpage. Status code: {response.status_code}")
    exit()

# Use response.content to retain raw bytes for proper decoding
soup = BeautifulSoup(response.content, 'html.parser')

courses = []
course_blocks = soup.find_all('div', class_='course')

for block in course_blocks:
    try:
        title_element = block.find('h3', class_='accordion-header xlarge')
        if title_element:
            # Replace non-breaking hyphen (U+2011) with standard dash
            title_text = title_element.get_text(strip=True).replace('\u2011', '-')
            title_parts = title_text.split('(')
            title = title_parts[0].strip()
            try:
                credits_raw = title_parts[1].replace('credits', '').replace(')', '').strip()
                credits = float(credits_raw) if '.' in credits_raw else int(credits_raw)
            except ValueError:
                credits = None
        else:
            title = None
            credits = None

        # Extract the description with proper spacing around hyperlinks
        description_element = block.find('div', class_='accordion-body')
        if description_element:
            full_text = " ".join(description_element.stripped_strings)  # Fix spacing around hyperlinks
        else:
            full_text = ""

        # Separate prerequisites, corequisites, description, and components
        prereq_text = ""
        coreq_text = ""
        components = None
        notes = None

        if "Prerequisite/Corequisite:" in full_text:
            prereq_start = full_text.find("Prerequisite/Corequisite:") + len("Prerequisite/Corequisite:")
            prereq_end = full_text.find("Description:", prereq_start)
            prereqs_coreqs_text = full_text[prereq_start:prereq_end].strip()

            if "previously" in prereqs_coreqs_text:
                prereq_text = prereqs_coreqs_text.split("previously:")[1].split(". The")[0].strip()
            if "previously or concurrently" in prereqs_coreqs_text:
                coreq_text = prereqs_coreqs_text.split("previously or concurrently:")[1].split(".")[0].strip()

        if "Description:" in full_text:
            desc_start = full_text.find("Description:") + len("Description:")
            desc_end = full_text.find("Component(s):", desc_start)
            description = full_text[desc_start:desc_end].strip() if desc_end != -1 else full_text[desc_start:].strip()

        if "Component(s):" in full_text:
            comp_start = full_text.find("Component(s):") + len("Component(s):")
            comp_end = full_text.find("Notes:", comp_start)
            components = full_text[comp_start:comp_end].strip() if comp_end != -1 else full_text[comp_start:].strip()

        if "Notes:" in full_text:
            notes_start = full_text.find("Notes:") + len("Notes:")
            notes = full_text[notes_start:].strip()

        # Prepare the course data
        course_data = {
            "title": title,
            "credits": credits,
            "prerequisites": prereq_text,
            "corequisites": coreq_text,
            "description": description,
            "components": components,
            "notes": notes
        }

        # Append to the courses list
        courses.append(course_data)

    except Exception as e:
        print(f"Error processing course block: {e}")

# Save the data to a JSON file
output_path = 'FRAN_courses.json'
with open(output_path, 'w', encoding='utf-8') as json_file:
    json.dump(courses, json_file, indent=4, ensure_ascii=False)

print(f"Scraped data has been saved to {output_path}")
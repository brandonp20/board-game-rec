# reviewer_scrape.py
import requests
from bs4 import BeautifulSoup
import time
import psycopg2
from psycopg2 import Error

def connect_to_db():
    return psycopg2.connect(
        user="brandon",
        password="Letsfuckinrock123456!",
        host="localhost",
        port="5432",
        database="board-games"
    )

def create_table(conn):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reviewers (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_plays INTEGER DEFAULT 0,
                total_log_score DECIMAL
            )
        """)
        conn.commit()
    except Error as e:
        print(f"Error creating table: {e}")
        raise e

def insert_username(conn, username):
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO reviewers (username) VALUES (%s) ON CONFLICT (username) DO NOTHING",
            (username,)
        )
        conn.commit()
    except Error as e:
        print(f"Error inserting username {username}: {e}")
        conn.rollback()

def scrape_bgg_reviewers(conn, page=1):
    url = f"https://boardgamegeek.com/browse/user/numreviews/page/{page}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        time.sleep(2)
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        username_divs = soup.find_all('div', class_='username')
        
        for div in username_divs:
            username_link = div.find('a')
            if username_link:
                username = username_link.text
                insert_username(conn, username)
                print(f"Added username: {username}")
                
    except requests.RequestException as e:
        print(f"Error fetching page {page}: {e}")

def main():
    try:
        conn = connect_to_db()
        create_table(conn)
        
        start_page = 11
        end_page = 30
        
        for page in range(start_page, end_page + 1):
            print(f"Scraping page {page}...")
            time.sleep(2)
            scrape_bgg_reviewers(conn, page)
            
    except Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
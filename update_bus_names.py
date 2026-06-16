from database import db

def update_bus_names():
    db.connect()
    db.cursor.execute("SELECT id, name FROM buses")
    buses = db.cursor.fetchall()
    
    updated = 0
    for bus in buses:
        bus_id = bus[0]
        # Clean existing names if they already have (SB-xxx) attached
        base_name = bus[1].split(' (')[0]
        new_name = f"{base_name} (SB-{100 + bus_id})"
        
        db.cursor.execute("UPDATE buses SET name = %s WHERE id = %s", (new_name, bus_id))
        updated += 1
        
    db.connection.commit()
    print(f"✅ Updated {updated} bus names with unique numbers.")

if __name__ == '__main__':
    update_bus_names()

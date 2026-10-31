import sqlite3
bd = sqlite3.connect("projet.db")
with open("export_projet.sql", "w", encoding="utf-8") as f:
    for ligne in bd.iterdump():
        f.write(ligne + "\n")
bd.close()
print("Export terminé : export_projet.sql")

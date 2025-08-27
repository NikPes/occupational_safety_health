from app import create_app

app = create_app()

print(list(app.url_map.iter_rules()))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
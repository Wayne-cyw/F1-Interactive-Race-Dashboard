from frameworks_drivers.web.app import create_app

app = create_app()

if __name__ == "__main__":
    print("=" * 60)
    print("F1 Dashboard API - Ultimate Edition v3.0")
    print("=" * 60)
    print("Backend running on http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, port=5000, host="0.0.0.0")

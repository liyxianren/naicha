"""
Flask应用启动脚本
"""
from app.main import app

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=True
    )

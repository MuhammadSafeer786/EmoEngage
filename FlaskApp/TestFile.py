from flask import Flask, render_template, Response, send_from_directory
app = Flask(__name__)






if __name__ == '__main__':
    app.run(debug=True)

from os import mkdir
from os.path import join, exists
from editjson import app, startup
from argparse import ArgumentParser

if __name__=='__main__':
    parser = ArgumentParser()
    parser.add_argument('-f','--json_file', default=None)
    parser.add_argument('-p','--port', default=5000)
    args = parser.parse_args()
    startup['json_file'] = args.json_file
    app.run(debug=True, port=args.port)

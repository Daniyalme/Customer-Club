from flask import Flask, request, jsonify
from flask_cors import CORS
import csv, os
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(__file__)
C1 = os.path.join(BASE, "data", "customers.csv")
P1 = os.path.join(BASE, "data", "purchases.csv")

PURCHASE_THRESHOLD = 300


def read_customers():
    if not os.path.exists(C1):
        return {}
    # with open(C1, newline="", encoding="utf-8") as f:
    #     reader = csv.DictReader(f)
    #     return {r["phone"]: r["name"] for r in reader}
    customers = pd.read_csv(C1, dtype=str)
    return {f"{phone}": f"{name}" for _, phone, name in customers.itertuples()}


def read_purchases():
    if not os.path.exists(P1):
        return []
    with open(P1, newline='', encoding='utf-8') as f:
       reader = csv.DictReader(f)
       return [
           {
               'id':     int(r['id']),
               'date':   r['date'],
               'phone':  r['phone'],
               'amount': float(r['amount']),
               'profit': float(r['profit'])
           }
           for r in reader
       ]


def write_customer(phone, name):
    with open(C1, "a", newline="\n", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([phone, name])


# def write_purchase(phone, amount):
#     date = datetime.now().strftime("%Y-%m-%d")
#     with open(P1, "a", newline="\n", encoding="utf-8") as f:
#         writer = csv.writer(f)
#         writer.writerow([date, phone, f"{amount:.2f}"])



def build_summary(phone, name):
    # df_purchases = read_purchases()
    # pcs = df_purchases[df_purchases["phone"] == phone]
    pcs = [p for p in read_purchases() if p["phone"] == phone]
    total = sum(p["amount"] for p in pcs)
    total_profit = sum(p["profit"] for p in pcs)
    numOverThresh = len([p for p in pcs if p["amount"] >= PURCHASE_THRESHOLD])
    return {
        "phone": phone,
        "name": name,
        "totalValue": total,
        "numPurchases": len(pcs),
        "numOverThresh": numOverThresh,
        "totalProfit": total_profit,
        "purchases": pcs,
    }
    
def write_purchases_file(all_pcs):
    with open(P1, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id','date','phone','amount', 'profit'])
        writer.writeheader()
        for p in all_pcs:
            writer.writerow({
                'id':     p['id'],
                'date':   p['date'],
                'phone':  p['phone'],
                'amount': f"{p['amount']:.2f}",
                'profit': f"{p['profit']:.2f}"
            })

def append_purchase(phone, amount, profit):
    pcs = read_purchases()
    next_id = max((p['id'] for p in pcs), default=0) + 1
    new = {
        'id':     next_id,
        'date':   datetime.now().strftime('%Y-%m-%d'),
        'phone':  phone,
        'amount': amount,
        'profit': profit
    }
    pcs.append(new)
    write_purchases_file(pcs)
    return new



@app.route("/customers/<phone>", methods=["GET"])
def get_customer(phone):
    custs = read_customers()
    if phone not in custs.keys():
        return jsonify({"message": "Customer not found."}), 404
    return jsonify(build_summary(phone, custs[phone]))


@app.route("/customers/<phone>/purchase", methods=["POST"])
def add_purchase(phone):
    data = request.get_json()
    amount = data.get("amount")
    name = data.get("name", "").strip()
    profit = data.get("profit")
    
    if amount is None or amount <= 0:
        return jsonify({"message": "Invalid purchase amount."}), 400

    custs = read_customers()
    # new customer?
    if phone not in custs:
        if not name:
            return jsonify({"message": "Name required for new customer."}), 400
        write_customer(phone, name)
        custs[phone] = name

    # record purchase
    append_purchase(phone, amount, profit)
    
    # respond with fresh summary + all purchases
    return jsonify(build_summary(phone, custs[phone]))


@app.route('/purchases/<int:pid>', methods=['PUT'])
def edit_purchase(pid):
    data   = request.get_json()
    amount = data.get('amount')
    profit = data.get('profit')
    if amount is None or amount <= 0:
        return jsonify({'message': 'Invalid amount.'}), 400

    pcs = read_purchases()
    found = next((p for p in pcs if p['id'] == pid), None)
    if not found:
        return jsonify({'message': 'Purchase not found.'}), 404

    found['amount'] = amount
    found['profit'] = profit
    write_purchases_file(pcs)
    custs = read_customers()
    return jsonify(build_summary(found['phone'], custs[found['phone']]))

@app.route('/purchases/<int:pid>', methods=['DELETE'])
def delete_purchase(pid):
    pcs = read_purchases()
    found = next((p for p in pcs if p['id'] == pid), None)
    if not found:
        return jsonify({'message': 'Purchase not found.'}), 404

    pcs = [p for p in pcs if p['id'] != pid]
    write_purchases_file(pcs)
    custs = read_customers()
    return jsonify(build_summary(found['phone'], custs[found['phone']]))


if __name__ == "__main__":
    os.makedirs(os.path.join(BASE, "data"), exist_ok=True)
    # ensure headers
    if not os.path.exists(C1):
        with open(C1, "w", newline="", encoding="utf-8") as f:
            f.write("phone,name\n")
    if not os.path.exists(P1):
        with open(P1, "w", newline="", encoding="utf-8") as f:
            f.write("date,phone,amount\n")
    app.run(host="0.0.0.0", port=4000, debug=True)

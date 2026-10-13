import os
import joblib

from sklearn.ensemble import RandomForestClassifier


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "parking_model.pkl"
)


def train_model():

    # Features:
    # hour, day, traffic, capacity, occupied

    X = [
        [8, 0, 0, 100, 20],
        [9, 0, 1, 100, 40],
        [10, 0, 1, 100, 50],
        [12, 0, 2, 100, 80],
        [13, 0, 2, 100, 85],
        [14, 0, 2, 100, 75],
        [17, 0, 2, 100, 90],
        [18, 0, 2, 100, 95],
        [19, 0, 2, 100, 92],
        [20, 0, 1, 100, 70],

        [8, 1, 0, 100, 15],
        [10, 1, 0, 100, 30],
        [12, 1, 1, 100, 55],
        [15, 1, 1, 100, 60],
        [18, 1, 2, 100, 88],
        [20, 1, 1, 100, 65],

        [8, 5, 0, 100, 10],
        [10, 5, 0, 100, 25],
        [12, 5, 1, 100, 45],
        [14, 5, 1, 100, 50],
        [17, 5, 2, 100, 85],
        [19, 5, 2, 100, 90],

        [9, 6, 0, 100, 15],
        [11, 6, 0, 100, 25],
        [14, 6, 1, 100, 40],
        [17, 6, 1, 100, 55],
        [19, 6, 1, 100, 60],
    ]

    # 1 = parking available
    # 0 = parking full / unavailable

    y = [
    1, 1, 1, 1, 1,
    1, 0, 0, 0, 1,

    1, 1, 1, 1, 0, 1,

    1, 1, 1, 1, 0, 0,

    1, 1, 1, 1, 1
]

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)

    print("Random Forest model trained successfully.")


def load_model():

    if not os.path.exists(MODEL_PATH):
        train_model()

    return joblib.load(MODEL_PATH)


model = load_model()


def predict_parking(
    hour,
    day,
    traffic,
    capacity,
    occupied
):

    traffic_map = {
        "low": 0,
        "medium": 1,
        "high": 2
    }

    traffic_value = traffic_map.get(
        traffic.lower(),
        1
    )

    features = [[
        hour,
        day,
        traffic_value,
        capacity,
        occupied
    ]]

    prediction = model.predict(features)[0]

    probabilities = model.predict_proba(features)[0]

    confidence = round(
        max(probabilities) * 100
    )

    return {
        "available": bool(prediction),
        "confidence": confidence
    }
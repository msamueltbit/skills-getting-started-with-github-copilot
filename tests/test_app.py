import pytest
from fastapi.testclient import TestClient


def test_homepage_redirects_to_static_page(client: TestClient):
    # Arrange
    url = "/"

    # Act
    response = client.get(url, follow_redirects=False)

    # Assert
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_details_and_participants(client: TestClient, activity_data):
    # Arrange
    url = "/activities"

    # Act
    response = client.get(url)

    # Assert
    assert response.status_code == 200
    assert response.json() == activity_data


def test_signup_adds_participant_and_preserves_other_data(client: TestClient, activity_data):
    # Arrange
    email = "student@example.edu"
    expected = activity_data
    expected["Chess Club"]["participants"].append(email)

    # Act
    response = client.post("/activities/Chess%20Club/signup", params={"email": email})
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for Chess Club"}
    assert activities_response.status_code == 200
    assert activities_response.json() == expected


def test_signup_rejects_duplicate_without_changing_data(client: TestClient, activity_data):
    # Arrange
    email = activity_data["Chess Club"]["participants"][0]

    # Act
    response = client.post("/activities/Chess%20Club/signup", params={"email": email})
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 400
    assert response.json() == {"detail": "Student is already signed up"}
    assert activities_response.json() == activity_data


def test_unregister_removes_participant_and_preserves_other_data(
    client: TestClient, activity_data
):
    # Arrange
    email = activity_data["Chess Club"]["participants"].pop(0)
    expected = activity_data

    # Act
    response = client.delete(
        "/activities/Chess%20Club/participants", params={"email": email}
    )
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from Chess Club"}
    assert activities_response.status_code == 200
    assert activities_response.json() == expected


def test_unregister_last_participant_leaves_empty_activity(client: TestClient):
    # Arrange
    email = "student@example.edu"
    signup_response = client.post(
        "/activities/Art%20Club/signup", params={"email": email}
    )
    assert signup_response.status_code == 200

    # Act
    response = client.delete(
        "/activities/Art%20Club/participants", params={"email": email}
    )
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert activities_response.json()["Art Club"]["participants"] == []


def test_unregister_rejects_missing_participant(client: TestClient, activity_data):
    # Arrange
    email = "missing@example.edu"

    # Act
    response = client.delete(
        "/activities/Chess%20Club/participants", params={"email": email}
    )
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Student is not signed up"}
    assert activities_response.json() == activity_data


@pytest.mark.parametrize(
    ("method", "endpoint"),
    [("POST", "signup"), ("DELETE", "participants")],
)
def test_unknown_activity_returns_not_found(
    client: TestClient, activity_data, method: str, endpoint: str
):
    # Arrange
    url = f"/activities/Unknown/{endpoint}"
    email = "student@example.edu"

    # Act
    response = client.request(method, url, params={"email": email})
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}
    assert activities_response.json() == activity_data


@pytest.mark.parametrize(
    ("method", "endpoint"),
    [("POST", "signup"), ("DELETE", "participants")],
)
def test_missing_email_returns_validation_error(
    client: TestClient, activity_data, method: str, endpoint: str
):
    # Arrange
    url = f"/activities/Chess%20Club/{endpoint}"

    # Act
    response = client.request(method, url)
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"] == ["query", "email"] for error in errors)
    assert activities_response.json() == activity_data

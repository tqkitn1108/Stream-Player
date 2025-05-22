import axios from "axios";

const KEYCLOAK_BASE_URL = 'https://localhost:9090';
const REALM = 'vva';
const ADMIN_CLIENT_ID = 'admin-cli';
const ADMIN_USERNAME = 'test';
const ADMIN_PASSWORD = '123456';

const getAdminToken = async () => {
  const data = new URLSearchParams({
    client_id: ADMIN_CLIENT_ID,
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
    grant_type: 'password'
  });

  try {
    const response = await axios.post(`${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`, data);
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching admin token:', error.response.data);
  }
};

const createUser = async (token, email, password) => {
  const user = {
    username: email,
    email: email,
    enabled: true,
    emailVerified: false, // Email chưa được xác minh
    credentials: [
      {
        type: "password",
        value: password,
        temporary: false
      }
    ]
  };

  try {
    const response = await axios.post(
      `${KEYCLOAK_BASE_URL}/auth/admin/realms/${REALM}/users`,
      user,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.id; // Trả về user-id để gửi email xác minh
  } catch (error) {
    console.error('Error creating user:', error.response.data);
  }
};

const sendVerificationEmail = async (token, userId) => {
  try {
    const response = await axios.put(
      `${KEYCLOAK_BASE_URL}/auth/admin/realms/${REALM}/users/${userId}/send-verify-email`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Verification email sent:', response.data);
  } catch (error) {
    console.error('Error sending verification email:', error.response.data);
  }
};

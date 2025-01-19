export type User = {
  email: string;
  id: string;
  username: string;
};

const apiUrl = import.meta.env.VITE_BACKEND_URL;

export const registerUser = async (
  email: string,
  password: string
): Promise<{
  data: string | null;
  error: string | null;
}> => {
  try {
    const response = await fetch(apiUrl + 'register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseBody = await response.json();

    // Check for unsuccessful response
    if (!response.ok || !responseBody.success) {
      return {
        data: null,
        error: responseBody.error?.message || 'Failed to register',
      };
    }

    // Return success message
    return {
      data: responseBody.data?.message || 'Registration successful.',
      error: null,
    };
  } catch (error) {
    console.error('Registration error:', error);

    // Handle unexpected errors
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{
  data: User | null;
  error: string | null;
}> => {
  try {
    const response = await fetch(apiUrl + 'login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseBody = await response.json();

    // Check for unsuccessful response
    if (!response.ok || !responseBody.success) {
      return {
        data: null,
        error: responseBody.error?.message || 'Failed to log in',
      };
    }

    // On success, save token and return user data
    localStorage.setItem('token', responseBody.data.token);
    return {
      data: {
        id: responseBody.data.id,
        email: responseBody.data.email,
        username: responseBody.data.email.split('@')[0],
      },
      error: null,
    };
  } catch (error) {
    console.error('Login error:', error);

    // Handle unexpected errors
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

export const fetchUserData = async (
  token: string
): Promise<{ data: User | null; error: string | null }> => {
  try {
    const response = await fetch(apiUrl + 'user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const responseBody = await response.json();

    // Check for unsuccessful response
    if (!response.ok || !responseBody.success) {
      return {
        data: null,
        error: responseBody.error?.message || 'Failed to fetch user data',
      };
    }

    // Map response data to User object
    const session: User = {
      username: responseBody.data.email.split('@')[0],
      email: responseBody.data.email,
      id: responseBody.data.id,
    };

    return { data: session, error: null };
  } catch (error) {
    console.error('Error fetching user data:', error);

    // Handle unexpected errors
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

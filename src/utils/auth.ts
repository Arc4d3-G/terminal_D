export type User = {
  email: string;
  id: string;
};

const apiUrl = import.meta.env.VITE_BACKEND_URL;
console.log(apiUrl);

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

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.message || 'Failed to register' };
    }

    return { data: data.message, error: null };
  } catch (error) {
    console.error('Registration error:', error);
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

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      return { data: { id: data.id, email: data.email }, error: null };
    } else {
      return { data: null, error: data.message || 'Failed to log in' };
    }
  } catch (error) {
    console.error('Login error:', error);
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

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.message || 'Failed to fetch user data' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

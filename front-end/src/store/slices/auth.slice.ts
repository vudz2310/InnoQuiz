import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { User } from "../../types/auth.interface";

const getSavedUser = (): User | null => {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const initialUser = getSavedUser();

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: !!initialUser,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("user", JSON.stringify(action.payload));
      //   localStorage.setItem("profile", JSON.stringify(action.payload));
    },

    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;

export default authSlice.reducer;

import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterSlice";
import focusReducer from "./slices/focusSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    focus: focusReducer
    // add other slices here
  },
});
export type AppStore = typeof store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

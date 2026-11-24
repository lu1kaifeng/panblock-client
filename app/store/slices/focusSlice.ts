import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import type {Contig} from "~/data/SynBlock";

interface FocusState{
    contigs: Contig[];
}

const focusInitialState : FocusState = {
    contigs: []
}

const focusSlice = createSlice({
    name: "focusSlice",
    initialState: focusInitialState,
    reducers: {
        setContigs: (state,action:PayloadAction<Contig[]>) => {
            state.contigs  = action.payload;
        }
    },
});

export const { setContigs } = focusSlice.actions;
export default focusSlice.reducer;

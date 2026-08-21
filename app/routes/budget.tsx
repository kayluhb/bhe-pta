import {redirect} from 'react-router';

const BUDGET_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1TyXb0HqRRPCIhaa-ISYnoIB8SO_T8nFc_86yrYQ8EEg/edit?usp=sharing';

export function loader() {
  return redirect(BUDGET_SHEET_URL);
}

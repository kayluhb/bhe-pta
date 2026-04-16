import {redirect} from 'react-router';

const BUDGET_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1dpRJ7Bo-IBPRDCI_HSC-2myluycqRP1MDreN_Os1oPE/edit?usp=sharing';

export function loader() {
  return redirect(BUDGET_SHEET_URL);
}

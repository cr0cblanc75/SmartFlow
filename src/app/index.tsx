import { Redirect } from "expo-router";

export default function Index() {
    return (console.log("Redirecting to /login..."), (<Redirect href="/login" />));
}

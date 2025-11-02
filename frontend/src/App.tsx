import UploadForm from "./components/UploadForm";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ResultPage from "./pages/ResultPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <Routes>
            <Route path="/" element={<UploadForm />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

import UploadForm from "./components/UploadForm";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <UploadForm />
      </main>
      <Footer />
    </div>
  );
}

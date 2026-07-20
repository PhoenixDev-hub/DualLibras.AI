import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Problema from '../components/landing/Problema';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Problema />
      </main>
    </div>
  );
}

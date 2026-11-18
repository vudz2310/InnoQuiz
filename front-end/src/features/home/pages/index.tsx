import HomePage2 from "./HomePage2";
import HomePage3 from "./HomePage3";
import HomePage4 from "./HomePage4";
import DashboardLayout from "../../../layouts/Dashboard";
import HomePage1 from "./HomePage1";
import LearningModesHomeSection from "../components/LearningModesHomeSection";

export default function HomePage() {
  return (
    <>
      <DashboardLayout>
        <HomePage1 />
        <LearningModesHomeSection />
        <HomePage2 />
        <HomePage3 />
        <HomePage4 />
      </DashboardLayout>
    </>
  );
}


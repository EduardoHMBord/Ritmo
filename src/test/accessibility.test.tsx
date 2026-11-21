import { fireEvent, render, screen } from "@testing-library/react";
import axe, { type RunOptions } from "axe-core";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { STORAGE_KEY } from "../services/storage";
import { makeTestData } from "./fixtures";

const AXE_OPTIONS: RunOptions = {
  rules: { "color-contrast": { enabled: false } },
};

async function expectNoViolations(): Promise<void> {
  const results = await axe.run(document.body, AXE_OPTIONS);
  expect(results.violations).toEqual([]);
}

describe("verificações automáticas de acessibilidade (axe-core)", () => {
  it("não encontra violações nas cinco áreas principais", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(makeTestData()));
    render(<App />);

    await expectNoViolations();

    for (const view of [
      "Rotinas",
      "Atividades",
      "Modo simplificado",
      "Configurações",
      "Início",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: view }));
      await expectNoViolations();
    }
  });

  it("anuncia mensagens de backup com papéis acessíveis", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Configurações" }));

    const exportButton = screen.getByRole("button", { name: "Exportar backup" });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: () => "blob:teste",
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => {},
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    fireEvent.click(exportButton);
    expect(screen.getByRole("status").textContent).toContain("Backup exportado");

    const input = screen.getByLabelText("Arquivo de backup (.json)");
    fireEvent.change(input, {
      target: { files: [new File(["{ inválido"], "ruim.json", { type: "application/json" })] },
    });

    expect((await screen.findByRole("alert")).textContent).toContain("JSON válido");
    await expectNoViolations();
  });
});

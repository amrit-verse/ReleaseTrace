import { NextResponse } from "next/server";
import { HindsightAdapter } from "@/intelligence/hindsight/adapter";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get("bankId") || "releasetrace-default";
    const query = searchParams.get("q") || "deployment failure migration";

    const adapter = HindsightAdapter.getInstance();
    const recallResult = await adapter.recall(bankId, query);

    return NextResponse.json({
      status: "ok",
      bankId,
      total: recallResult.results.length,
      memories: recallResult.results,
      source: adapter.isMock() ? "HINDSIGHT_MOCK_TRANSPORT" : "HINDSIGHT_CLOUD",
      isMock: adapter.isMock(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to retrieve memories", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bankId, title, service, rootCause, resolution, confirmation, tags, content } = body;

    if (!title || !service || !rootCause) {
      return NextResponse.json(
        { error: "Missing required fields: title, service, rootCause" },
        { status: 400 }
      );
    }

    if (!confirmation || !confirmation.isConfirmed || !confirmation.confirmedBy) {
      return NextResponse.json(
        { error: "Engineer confirmation required. Speculative or unconfirmed memories cannot be retained into Hindsight." },
        { status: 403 }
      );
    }

    const targetBankId = bankId || "releasetrace-default";
    const adapter = HindsightAdapter.getInstance();

    const memoryContent = content || JSON.stringify({
      title,
      service,
      rootCause,
      resolution,
      confirmedBy: confirmation.confirmedBy,
      timestamp: new Date().toISOString(),
    });

    const retainResult = await adapter.retain(targetBankId, memoryContent, {
      document_id: `MEM-${Date.now()}`,
      tags: tags || [service, "verified-resolution"],
      context: `Confirmed by ${confirmation.confirmedBy}: ${resolution}`,
    });

    return NextResponse.json(
      {
        message: "Memory successfully indexed and committed to Hindsight Memory Engine",
        bankId: targetBankId,
        retainResult,
        retentionStatus: "VERIFIED_RETENTION",
        isMock: adapter.isMock(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to retain memory", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get("bankId") || "releasetrace-default";
    const adapter = HindsightAdapter.getInstance();
    adapter.clearMockBank(bankId);
    return NextResponse.json({ success: true, message: `Bank ${bankId} cleared.` });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to clear bank", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

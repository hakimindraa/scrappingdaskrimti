from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.insight_store import insight_store

router = APIRouter()


# === Request Models ===

class SuratMasukRow(BaseModel):
    rowId: str
    jenis: str
    asal: str
    month: int
    year: int


class SuratKeluarRow(BaseModel):
    rowId: str
    jenis: str
    month: int
    year: int


class SaveInsightRequest(BaseModel):
    suratMasuk: List[SuratMasukRow]
    suratKeluar: List[SuratKeluarRow]
    jenisRowOverrides: Dict[str, str]
    asalRowOverrides: Dict[str, str]
    yearRowOverrides: Dict[str, int]
    monthRowOverrides: Dict[str, int]


class OverridesRequest(BaseModel):
    overrides: Dict[str, str]


# === Endpoints ===

@router.post("/save")
async def save_insight_data(request: SaveInsightRequest):
    """Save all insight data to database"""
    try:
        # Save surat masuk
        masuk_result = insight_store.save_surat_masuk(
            [row.dict() for row in request.suratMasuk]
        )
        if not masuk_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to save surat masuk: {masuk_result.get('error')}")
        
        # Save surat keluar
        keluar_result = insight_store.save_surat_keluar(
            [row.dict() for row in request.suratKeluar]
        )
        if not keluar_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to save surat keluar: {keluar_result.get('error')}")
        
        # Save row-level overrides
        jenis_row_result = insight_store.save_jenis_row_overrides(request.jenisRowOverrides)
        if not jenis_row_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to save jenis row overrides: {jenis_row_result.get('error')}")
        
        asal_row_result = insight_store.save_asal_row_overrides(request.asalRowOverrides)
        if not asal_row_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to save asal row overrides: {asal_row_result.get('error')}")
        
        date_result = insight_store.save_date_row_overrides(
            request.yearRowOverrides,
            request.monthRowOverrides
        )
        if not date_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to save date overrides: {date_result.get('error')}")
        
        return {
            "success": True,
            "message": "Data berhasil disimpan ke database",
            "counts": {
                "suratMasuk": masuk_result["count"],
                "suratKeluar": keluar_result["count"],
                "jenisRowOverrides": jenis_row_result["count"],
                "asalRowOverrides": asal_row_result["count"],
                "dateOverrides": date_result["count"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/load")
async def load_insight_data():
    """Load all insight data from database"""
    try:
        # Load surat masuk
        masuk_result = insight_store.load_surat_masuk()
        if not masuk_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to load surat masuk: {masuk_result.get('error')}")
        
        # Load surat keluar
        keluar_result = insight_store.load_surat_keluar()
        if not keluar_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to load surat keluar: {keluar_result.get('error')}")
        
        # Load row-level overrides
        jenis_row_result = insight_store.load_jenis_row_overrides()
        if not jenis_row_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to load jenis row overrides: {jenis_row_result.get('error')}")
        
        asal_row_result = insight_store.load_asal_row_overrides()
        if not asal_row_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to load asal row overrides: {asal_row_result.get('error')}")
        
        date_result = insight_store.load_date_row_overrides()
        if not date_result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to load date overrides: {date_result.get('error')}")
        
        return {
            "success": True,
            "data": {
                "suratMasuk": masuk_result["data"],
                "suratKeluar": keluar_result["data"],
                "jenisRowOverrides": jenis_row_result["overrides"],
                "asalRowOverrides": asal_row_result["overrides"],
                "yearRowOverrides": date_result["yearOverrides"],
                "monthRowOverrides": date_result["monthOverrides"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear")
async def clear_insight_data():
    """Clear all insight data from database"""
    try:
        result = insight_store.clear_all_insight_data()
        if not result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to clear data: {result.get('error')}")
        
        return {
            "success": True,
            "message": "Semua data insight berhasil dihapus"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === Overrides Endpoints ===

@router.post("/overrides/jenis")
async def save_jenis_overrides(request: OverridesRequest):
    """Save jenis kategori overrides"""
    try:
        result = insight_store.save_jenis_overrides(request.overrides)
        if not result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to save overrides: {result.get('error')}")
        
        return {
            "success": True,
            "message": f"Berhasil menyimpan {result['count']} override jenis",
            "count": result["count"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overrides/jenis")
async def load_jenis_overrides():
    """Load jenis kategori overrides"""
    try:
        result = insight_store.load_jenis_overrides()
        if not result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to load overrides: {result.get('error')}")
        
        return {
            "success": True,
            "overrides": result["overrides"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/overrides/asal")
async def save_asal_overrides(request: OverridesRequest):
    """Save asal kelompok overrides"""
    try:
        result = insight_store.save_asal_overrides(request.overrides)
        if not result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to save overrides: {result.get('error')}")
        
        return {
            "success": True,
            "message": f"Berhasil menyimpan {result['count']} override asal",
            "count": result["count"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overrides/asal")
async def load_asal_overrides():
    """Load asal kelompok overrides"""
    try:
        result = insight_store.load_asal_overrides()
        if not result["success"]:
            raise HTTPException(status_code=500, detail=f"Failed to load overrides: {result.get('error')}")
        
        return {
            "success": True,
            "overrides": result["overrides"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
